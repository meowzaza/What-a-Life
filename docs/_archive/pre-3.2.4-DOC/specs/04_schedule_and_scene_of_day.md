# 04 — ตารางประจำวัน (DayPlan) และการเลือกฉากตามกิจกรรม

> ใช้ใน Phase 3.2 | อ้างอิงคู่กับ 01 (ฉาก §3), 02 (ที่อยู่), 03 (งาน/daypart/ผับ) | อ่าน docs/DESIGN.md ก่อนเสมอ
> หลักการ: Engine คำนวณว่า "ตอนนี้ตัวละครทำอะไร อยู่ที่ไหน" ด้วย pure function ล้วน UI แค่แสดงผล ห้ามใช้ Math.random

---

## 1. ปัญหาที่พบจากโค้ดจริง (ต้องแก้ก่อนสร้างของใหม่)

**1.1 ฉากค้างที่บ้านครึ่งหนึ่งของเวลา**
`resolveDaypart` ตกไปที่ค่าเริ่มต้น `totalDays % 4` คือ วันนี้เช้า พรุ่งนี้บ่าย มะรืนเย็น วันถัดไปดึก แล้วฉากทำงาน/โรงเรียนเปิดแค่ morning/afternoon พอเป็นเย็นหรือดึก `isSceneOpen` เป็น false จึง fallback กลับบ้านทุกครั้ง ผลคือสลับ บ้าน ทำงาน บ้าน ทำงาน โดยไม่มีเหตุผลให้ผู้เล่นเห็น
→ ต้องให้ daypart มาจาก "ช่องเวลาในแผนของวัน" ไม่ใช่เลขวนรอบ

**1.2 id งานไม่ตรงกับตารางฉาก**
`pickSceneForState` สลับตาม jobId ที่ไม่มีใน `JOBS` จริง (`rider_delivery`, `barista`, `minimart`, `factory_worker`, `pub_*`) ส่วนงานที่มีจริง (`convenience_staff`, `food_rider`, `technician`, `civil_servant` ฯลฯ) หลายตัวตกไป `default` แล้วกลับบ้าน และ `getJobShiftDaypart` ก็เช็ค `pub_` ที่ยังไม่มีงานจริงรองรับ
→ ย้ายข้อมูล "งานนี้ใช้ฉากไหน กะไหน" ไปไว้ที่ `JobDefinition` โดยตรง (ข้อ 3) แล้วลบ switch ใน scene.ts

**1.3 ไม่มีตัวแทนของ "ช่วงเวลาในหนึ่งวัน"**
1 Tick = 1 วัน แต่ฉากถูกเลือกต่อ Tick เดียว ผู้เล่นจึงไม่เห็นว่าเช้าไปทำงาน เย็นไปกินข้าว ดึกกลับบ้านนอน
→ เพิ่ม DayPlan 4 ช่อง (ข้อ 2)

---

## 2. DayPlan: 4 ช่องต่อวัน

```ts
type Activity =
  | 'sleep' | 'work' | 'study' | 'side_gig'
  | 'social' | 'hobby' | 'family' | 'self_dev' | 'nightlife' | 'errand' | 'rest';

interface DaySlot {
  daypart: Daypart;          // morning | afternoon | evening | night
  activity: Activity;
  sceneId: string;           // ผ่านด่าน isSceneOpen แล้วเท่านั้น
  fallbackFrom?: string;     // ถ้าฉากที่ต้องการปิด/ไม่ผ่านอายุ แล้วถอยมาบ้าน ให้บันทึกไว้ (ใช้ใน Explain)
  importance: number;        // ใช้เลือกฉากเด่นตอนเล่นเร็ว
}
type DayPlan = [DaySlot, DaySlot, DaySlot, DaySlot];

// engine/dayPlan.ts  (pure)
function buildDayPlan(state: GameState): DayPlan
```

**อินพุตที่ใช้ (ทั้งหมดมีอยู่แล้ว):** อายุ/ช่วงวัย, `economy.jobId` + `JobDefinition`, `routine`, `timeAllocation`, `date.dayOfWeek`, `sceneMode`, `housingId`, `character.indices`/`resources.energy`, `seed + totalDays` (สำหรับสุ่มแบบกำหนดได้)

### 2.1 ลำดับการจัดช่อง (เติมจากสำคัญไปน้อย)
1. **เงื่อนไขพิเศษ:** ตายแล้ว / `sceneMode` ที่ยังไม่หมดอายุ (เช่น นอนโรงพยาบาล) → ทุกช่องเป็นฉากนั้นตามกฎเดิม
2. **ป่วยหนัก:** `indices.physical < 22` หรือ (`< 35` และพลังงาน `< 12`) → ช่องกลางวันเป็น `hospital`
3. **ช่องผูกมัด (ล็อก):**
   - นักเรียน/นักศึกษา วันธรรมดา → `study` ช่อง morning + afternoon ฉากตามระดับชั้น (`school_*` หรือ `university`)
   - งานประจำ ตามกะ `job.shift` วันทำงาน → `work` ตามข้อ 2.2
   - ทารก/เตาะแตะ (< 6) → ทุกช่องที่บ้าน
4. **ช่องงานเสริม** (`routine === 'side_gig'`, ต่อไปคือ `sideGig` จริงใน Phase 3.3) → `side_gig` 1 ช่องที่ว่างและไม่ชนกะ (ปกติ evening) ฉากตาม `gig.sceneId`
5. **ช่องว่างที่เหลือ** → เลือกตามสัดส่วน `timeAllocation` ต่อสัปดาห์ (social/hobby/family/selfDev/nightlife) ด้วยการสุ่มแบบกำหนดได้ จาก `hash(seed, totalDays, daypart)` แล้วแปลงเป็นฉากตามตาราง 2.3
6. **ช่อง night ที่ไม่ใช่กะดึก/กิจกรรมกลางคืน** → `sleep` ที่บ้านเสมอ (ไม่นับเป็นกิจกรรม)

### 2.2 กะงาน (ใส่ในข้อมูลงาน ไม่ใช่ในโค้ด)
| กะ (`shift`) | ช่องที่ใช้ | ตัวอย่างงาน |
|---|---|---|
| `day` | morning + afternoon | office_junior, civil_servant, technician, software_dev |
| `day_long` | morning + afternoon + evening | small_business (เจ้าของร้าน) |
| `split` | afternoon + evening หรือ morning + evening | convenience_staff (หมุนกะแบบกำหนดได้ต่อสัปดาห์) |
| `flex` | 2 ช่องที่ยืดหยุ่น | food_rider (เย็นจัดเป็นช่องหลัก), sales_exec |
| `night` | evening + night | งานผับ/บาร์ในอนาคต (ต้องอายุ 18+) |

- วันหยุด: เสาร์–อาทิตย์ งานออฟฟิศ/ราชการ ไม่มี `work`; งานร้านค้า/ไรเดอร์/ธุรกิจส่วนตัว ทำต่อ (หรือหยุด 1 วันตามกะ)
- นักเรียน: ปิดเทอม/วันหยุดราชการ ใช้ตาราง "ช่องว่างที่เหลือ" ทั้งวัน (ใช้ปฏิทินที่มีใน clock.ts ถ้ายังไม่มีวันหยุดให้ใส่ตารางสั้นๆ ใน data)
- โอที (`routine === 'hustle'`): ขยายกะไป 1 ช่องถัดไปแบบกำหนดได้ (ฉากเดิม แต่ภาพกลางคืน)
- เด็ก 15–17: ห้ามช่อง night ที่ทำงาน/ผับ (กฎ 03 §2 ใช้ `getAgeEmploymentRules`)

### 2.3 ตาราง กิจกรรมว่าง → ฉาก
| activity | ฉากตัวเลือก (เลือกตามชนชั้น `deriveClassTier` + ภูมิภาค + เปิดอยู่) |
|---|---|
| social | cafe, street_shops, market_fresh (ชนชั้นสูงขึ้น: cafe ก่อน) |
| hobby | บ้านตัวเอง (ส่วนใหญ่), street_shops |
| family | บ้านตัวเอง, restaurant_tamsang (มื้อครอบครัว) |
| self_dev | บ้านตัวเอง, university (ห้องสมุดดึก ถ้าเป็นนักศึกษา), cafe |
| nightlife | nightlife_pub (ถ้า `canEnterNightlife`), ไม่ผ่านให้ใช้ street_food_night |
| errand | shop_minimart, market_fresh, street_shops, hospital (ถ้าสุขภาพไม่ดี) |
| rest | บ้านตัวเอง |
| side_gig | ตาม `gig.sceneId` (ไรเดอร์ = street_shops, ขายของ = market_fresh ฯลฯ) |

ทุกครั้งต้องผ่าน `isSceneOpen(sceneId, daypart, age, settings)` ถ้าไม่ผ่านให้ลอง "ตัวเลือกถัดไปในแถวเดียวกัน" ก่อน แล้วค่อยถอยบ้านพร้อมบันทึก `fallbackFrom`

---

## 3. ข้อมูลที่ต้องเพิ่มใน `JobDefinition` (src/data/thaiData.ts)

```ts
sceneId: string;                         // ฉากหลักของงาน เช่น 'work_corporate'
shift: 'day' | 'day_long' | 'split' | 'flex' | 'night';
weekendOff: boolean;
```

กรอกให้ครบทุกงานที่มีจริง:

| jobId | sceneId | shift | weekendOff |
|---|---|---|---|
| infant | (บ้าน) | — | — |
| student | ตามช่วงวัย | day | true |
| unemployed | (บ้าน) | — | — |
| convenience_staff | shop_minimart | split | false |
| food_rider | street_shops | flex | false |
| office_junior | work_corporate | day | true |
| technician | work_warehouse | day | true |
| sales_exec | work_corporate | flex | true |
| civil_servant | work_corporate | day | true |
| software_dev | work_corporate | day | true |
| small_business | restaurant_tamsang | day_long | false |
| sales_manager | work_corporate | day | true |

ถ้า Phase อื่นเพิ่มงานใหม่ (ผับ ฯลฯ) ต้องกรอก 3 ฟิลด์นี้ ไม่งั้น Validator ตอนโหลดแจ้งเตือน

---

## 4. การเลือกฉากและ daypart ใหม่

**ลำดับความสำคัญของฉากปัจจุบัน** (เพิ่มชั้น DayPlan เข้ากับ 01 §3):
1. Storylet / Prompt ระบุ `sceneId` หรือ `sceneTag`
2. `sceneMode` ที่ยังไม่หมดอายุ
3. **ช่องปัจจุบันใน DayPlan** (ใหม่ แทนการเดาจาก routine/jobId)
4. บ้านตามที่อยู่ปัจจุบัน

**`resolveDaypart(state, slotIndex?)`**
- ถ้ามี Prompt/Event ระบุ daypart ให้ใช้ตามนั้น
- ไม่งั้นคืน daypart ของช่องที่ส่งมา (หรือ "ช่องเด่น" ถ้าไม่ส่ง)
- เลิกใช้ `totalDays % 4` และเลิกเดาจาก routine/เสาร์-ศุกร์ ย้ายไปอยู่ใน `buildDayPlan` แทน
- `getDominantNightDaypart` เดิม ยังใช้ได้: เมื่อกิจกรรมกลางคืนเด่น ช่องว่างที่เหลือโน้มเป็น nightlife มากขึ้น

**ช่องเด่น (importance)**: event/storylet 100 > work/study 80 > side_gig 70 > nightlife 60 > social/errand 50 > hobby/family/self_dev 40 > rest/sleep 10

---

## 5. การแสดงผล (UI เท่านั้น ไม่กระทบ Engine)

- Engine เปิดเผย `getDayPlan(state)` เท่านั้น UI เลือกว่าจะโชว์ช่องไหน
- **ความเร็ว x1–x2:** ไล่แสดง 4 ช่องภายใน 1 วันเกม (เปลี่ยนฉากด้วย crossfade เดิม ~400ms) ใช้เศษของ accumulator เป็นตัวบอกช่อง
- **ความเร็ว x5 ขึ้นไป:** แสดงเฉพาะ "ช่องเด่น" ของวัน (กันภาพกระพริบ)
- **ตอนหยุดเวลา:** โชว์ช่องที่เด่นสุด และมีแถบ 4 ไอคอนเล็ก (เช้า/บ่าย/เย็น/ดึก) ให้กดดูฉากแต่ละช่อง และมีข้อความสั้นใต้ฉากว่า "กำลังทำอะไร ที่ไหน" เช่น "ทำงาน · บริษัทใหญ่" "นั่งคาเฟ่กับเพื่อน"
- ถ้าถอยมาบ้านเพราะฉากปิด ให้ "ทำไม?" อธิบายได้ เช่น "ร้านนี้ปิดช่วงดึก"
- ข้อความในกล่องคำพูด (`getSpeechText`) เปลี่ยนให้อ้างอิง activity ของช่องปัจจุบัน แทนการเดาจาก routine

---

## 6. จุดเชื่อมกับไฟล์จริงในโปรเจกต์

| ไฟล์ | สิ่งที่ต้องแก้ |
|---|---|
| `src/data/thaiData.ts` | เพิ่ม `sceneId/shift/weekendOff` ให้ `JobDefinition` ทุกงาน |
| `src/engine/dayPlan.ts` (ใหม่) | `buildDayPlan`, ตาราง activity→ฉาก, ช่องเด่น |
| `src/engine/scene.ts` | เลิก switch ตาม jobId ใน `pickSceneForState`; `resolveDaypart` ใช้ DayPlan; `resolveScene` ต่อชั้นที่ 3 |
| `src/data/timeAlloc.ts` + `engine/timeAlloc.ts` | (ทางเลือก Phase 3.3) เพิ่มหมวด `sideGig` เมื่อมีระบบงานเสริมจริง |
| `src/ui/components/SceneStage.tsx` | เลือกช่องตามความเร็ว/ตอนหยุด, แถบ 4 ช่อง, ข้อความ "ทำอะไรที่ไหน" |
| `src/ui/screens/MainGameScreen.tsx` | ส่งความเร็ว + เศษ accumulator ไปให้ SceneStage (แสดงผลเท่านั้น) |
| `docs/DESIGN.md` | อัปเดตแผนผังไฟล์และสถานะ Phase |

## 7. เกณฑ์ตรวจรับ (ตรวจด้วยปุ่ม Dev/สถานการณ์จริง ไม่ต้องเพิ่มชุดเทสต์ใหญ่)
- นักเรียนวันธรรมดา: เช้า+บ่ายเห็นโรงเรียน เย็นที่บ้านหรือที่อื่น ดึกที่บ้าน
- พนักงานออฟฟิศวันธรรมดาเห็นบริษัท วันเสาร์-อาทิตย์ไม่เห็นบริษัท
- พนักงานมินิมาร์ทเห็นร้านสะดวกซื้อ (ไม่ค้างที่บ้านเหมือนเดิม)
- `routine = side_gig` มีช่อง evening เป็นฉากงานเสริม
- อายุ < 18 ไม่มีทางเห็น `nightlife_pub` ในทุกช่อง
- seed เดียวกัน เล่น x1 กับ x20 ได้ DayPlan ชุดเดียวกัน
- ทุกการถอยมาบ้านมี `fallbackFrom` ใน Explain
