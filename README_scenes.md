# Scene assets (ฉากทั้งหมด)

แตก zip นี้ทับโปรเจกต์เดิมได้เลย (โครงสร้างเดียวกับ phase1_6_assets.zip)
ไม่ซ้ำ path กับตัวละคร:

- `public/assets/scenes/{sceneId}/day.png` และ `night.png` (688x384)
- `src/data/sceneManifest.json` (คู่กับ `characterManifest.json`)

21 ฉาก / 40 ภาพ (ฉาก `street_food_night` และ `nightlife_pub` มีเฉพาะ night)

การเลือกภาพ: morning/afternoon = day, evening/night = night
เปิด-ปิดตามเวลา ดู `availability` ใน manifest และ 03_jobs_nightlife_daypart.md ข้อ 3
