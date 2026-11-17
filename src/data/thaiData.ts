import type {
  EducationLevel,
  FamilyStructure,
  FamilyWealthTier,
  HousingId,
  LifeIndexKey,
  ParentEducation,
  PendingEventPrompt,
  RawStatKey,
  RegionId,
  RoutineFocus,
  SkillKey,
  TemperamentId,
} from '../engine/types';

export interface RegionInfo {
  id: RegionId;
  name: string;
  weight: number;
  costMultiplier: number;
  provinces: string[];
}

export const REGIONS: RegionInfo[] = [
  {
    id: 'bangkok',
    name: 'กรุงเทพฯ และปริมณฑล',
    weight: 22,
    costMultiplier: 1.25,
    provinces: ['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ'],
  },
  {
    id: 'central',
    name: 'ภาคกลาง',
    weight: 16,
    costMultiplier: 0.95,
    provinces: ['พระนครศรีอยุธยา', 'นครปฐม', 'สระบุรี', 'สุพรรณบุรี', 'ราชบุรี', 'เพชรบุรี'],
  },
  {
    id: 'northeast',
    name: 'ภาคตะวันออกเฉียงเหนือ',
    weight: 29,
    costMultiplier: 0.82,
    provinces: ['ขอนแก่น', 'นครราชสีมา', 'อุดรธานี', 'อุบลราชธานี', 'บุรีรัมย์', 'ร้อยเอ็ด', 'มหาสารคาม'],
  },
  {
    id: 'north',
    name: 'ภาคเหนือ',
    weight: 15,
    costMultiplier: 0.86,
    provinces: ['เชียงใหม่', 'เชียงราย', 'ลำปาง', 'พิษณุโลก', 'น่าน', 'แพร่'],
  },
  {
    id: 'east',
    name: 'ภาคตะวันออก',
    weight: 8,
    costMultiplier: 1.02,
    provinces: ['ชลบุรี', 'ระยอง', 'ฉะเชิงเทรา', 'จันทบุรี'],
  },
  {
    id: 'south',
    name: 'ภาคใต้',
    weight: 10,
    costMultiplier: 0.94,
    provinces: ['สงขลา', 'ภูเก็ต', 'สุราษฎร์ธานี', 'นครศรีธรรมราช', 'กระบี่'],
  },
];

export const FIRST_NAMES = {
  male: [
    'ธนกฤต', 'ณัฐวุฒิ', 'ปิยะพงษ์', 'กิตติศักดิ์', 'วรากร', 'ศุภชัย',
    'อภิสิทธิ์', 'จักรกฤษณ์', 'ธีรภัทร', 'พชร', 'ภาคิน', 'สิรวิชญ์',
    'ชนาธิป', 'อนุชา', 'เกรียงไกร', 'นนทวัฒน์', 'กฤตภาส', 'กฤติน',
    'กันตพัฒน์', 'ก้องภพ', 'กิตติพัฒน์', 'กิตติภพ', 'คณิศร', 'คมสัน',
    'จิรายุ', 'จิรวัฒน์', 'จตุพร', 'ฉัตรชัย', 'ชญานนท์', 'ชยพล',
    'ชวัลวิทย์', 'ชาคริต', 'ชาญชัย', 'ณรงค์ศักดิ์', 'ณัฐกิตติ์', 'ณัฐดนัย',
    'ณัฐนนท์', 'ณัฐพงษ์', 'ณัฐพล', 'ณัฐวัฒน์', 'ดนัย', 'ดุลยวิทย์',
    'ตรัยคุณ', 'ทศพล', 'ทัตเทพ', 'ธนดล', 'ธนธรณ์', 'ธนบดี',
    'ธนภัทร', 'ธนวัฒน์', 'ธนากร', 'ธนาธิป', 'ธันวา', 'ธีรเดช',
    'ธีรพงษ์', 'ธีรศักดิ์', 'นที', 'นพดล', 'นรวิชญ์', 'นฤเบศร์',
    'นวพล', 'นันทวัฒน์', 'นิติภูมิ', 'ปกรณ์', 'ปฐมพงศ์', 'ปภาวิน',
    'ปรมินทร์', 'ปรเมศวร์', 'ปวริศ', 'ปวเรศ', 'ปัณณวิชญ์', 'ปิยวัฒน์',
    'พงศกร', 'พงษ์พัฒน์', 'พนธกร', 'พรชัย', 'พรหมพิริยะ', 'พลกฤต',
    'พัทธดนย์', 'พีรพัฒน์', 'พีรวิชญ์', 'ภควัต', 'ภานุพงศ์', 'ภานุวัฒน์',
    'ภูมิพัฒน์', 'ภูริช', 'ภูวดล', 'มกรา', 'มนัสวี', 'ยศกร',
    'ยุทธนา', 'รชต', 'รัชชานนท์', 'รัชพล', 'วชิรวิทย์', 'วรเชษฐ์',
    'วรพล', 'วรเมธ', 'วศิน', 'วัชรพล', 'วิชญ์พล', 'วิทยา',
    'วิศรุต', 'วีรภัทร', 'ศรัณย์', 'ศราวุธ', 'ศิวัช', 'ศุภกฤต',
    'ศุภณัฐ', 'ศุภวิชญ์', 'สหรัถ', 'สุกฤษฎิ์', 'สุทธิพงษ์', 'สุเมธ',
    'อธิป', 'อนันต์', 'อภิวัฒน์', 'อัครเดช', 'อัครวินท์', 'อาทิตย์',
    'อิทธิพัทธ์', 'เอกชัย', 'เอกลักษณ์', 'โอฬาร',
  ],
  female: [
    'กัญญาณัฐ', 'พิมพ์ชนก', 'ณัฐธิดา', 'ศิริพร', 'ปภาวรินทร์', 'สุพัตรา',
    'ชนิสรา', 'วริศรา', 'ปิยธิดา', 'ชุติมณฑน์', 'ธัญญ่า', 'อริสรา',
    'กมลวรรณ', 'นฤมล', 'ภัทรวดี', 'มินตรา', 'กชมน', 'กชพร',
    'กนกพร', 'กนกวรรณ', 'กมลชนก', 'กมลเนตร', 'กมลพร', 'กรกนก',
    'กรกมล', 'กรวรรณ', 'กัญญารัตน์', 'กัลยาณี', 'กานต์พิชชา', 'กานต์สินี',
    'เกศรา', 'ขวัญข้าว', 'ขวัญชนก', 'ขวัญฤดี', 'เขมจิรา', 'เขมิกา',
    'คคนางค์', 'แคทรียา', 'จิดาภา', 'จินตนา', 'จิรประภา', 'จิราพร',
    'จุฑามาศ', 'จุฑารัตน์', 'เจนจิรา', 'ชนกนันท์', 'ชนิกานต์', 'ชไมพร',
    'ชลธิชา', 'ชลิดา', 'ชุติกาญจน์', 'ญานิศา', 'ญาณิน', 'ณัชชา',
    'ณัฐกานต์', 'ณัฐณิชา', 'ณัฐมน', 'ณิชาภัทร', 'ดลพร', 'ดาริกา',
    'ตรีนุช', 'เตือนใจ', 'ทัศนีย์', 'ทิพย์วรรณ', 'ธนพร', 'ธนัชพร',
    'ธัญชนก', 'ธัญพร', 'ธัญลักษณ์', 'ธารารัตน์', 'นงนุช', 'นภัสกร',
    'นภัสวรรณ', 'นลินี', 'นันทนา', 'นันทพร', 'นาตยา', 'นารีรัตน์',
    'นิภาพร', 'นิรมล', 'นิศาชล', 'เนตรนภา', 'บงกช', 'บุษบา',
    'เบญจมาศ', 'เบญจวรรณ', 'ปณิดา', 'ปทิตตา', 'ปนัดดา', 'ประภัสสร',
    'ปรียานุช', 'ปวีณา', 'ปัญชลี', 'ปาริฉัตร', 'ปิ่นอนงค์', 'เปมิกา',
    'ผกามาศ', 'พรรณิภา', 'พรพิมล', 'พริมโรส', 'พลอยไพลิน', 'พสชนัน',
    'พัชราภา', 'พัชริดา', 'พิชชาพร', 'พิชญาภา', 'พิมลพรรณ', 'พิมพา',
    'พิมพ์มาดา', 'พิไลพร', 'พีรญา', 'ภควรรณ', 'ภัคจิรา', 'ภัทรียา',
    'ภาวิณี', 'มณีรัตน์', 'มนัสนันท์', 'มนัสพร', 'มยุรา', 'มัลลิกา',
    'มาลินี', 'เมธาวี', 'เยาวลักษณ์', 'รวิสรา', 'รุ่งทิวา', 'ลลิตา',
    'ลักขณา', 'วรัญญา', 'วรรณิษา', 'วาสนา', 'วิชุดา', 'วิภาดา',
    'วิมลรัตน์', 'ศศิธร', 'ศศิวิมล', 'ศิริกัญญา', 'ศิริลักษณ์', 'สโรชา',
    'สิริกานต์', 'สิริพร', 'สุกัญญา', 'สุชาดา', 'สุนิสา', 'สุพรรษา',
    'สุภาวดี', 'สุรีย์พร', 'เสาวลักษณ์', 'หทัยชนก', 'หทัยรัตน์', 'อรทัย',
    'อรอนงค์', 'อรอุมา', 'อังคณา', 'อัจฉรา', 'อัญชลี', 'อาภาภรณ์',
    'อินทุอร', 'อุษณีย์', 'เอมิกา', 'ไอรดา',
  ],
  nonbinary: [
    'ณภัทร', 'รวิศ', 'ชญานิศ', 'ภีม', 'ตะวัน', 'สายธาร', 'คีรี', 'ธันวา',
    'กานต์', 'กิตติ์', 'คณาธิป', 'จีรวัฒน์', 'ชยุต', 'ชลันธร', 'ฌาน',
    'ณดล', 'ณัฐ', 'ณิชา', 'ต้นน้ำ', 'ต้นกล้า', 'ทิวา', 'ธารา',
    'ธาม', 'นที', 'นภนต์', 'นภัส', 'นรินทร์', 'นิรันดร์', 'ปณต',
    'ปรัชญ์', 'ปาณัสม์', 'ปุณณวิช', 'พสุธา', 'พัทธ์', 'พิชญ์', 'ภวิศ',
    'ภาสกร', 'ภิรมย์', 'ภูผา', 'มนัส', 'มินทร์', 'เมธัส', 'รพี',
    'รวินท์', 'รุ้ง', 'ลภัส', 'วรัท', 'วริทธิ์', 'วสุ', 'วิญญ์',
    'ศิลา', 'ศิวกร', 'ศุภณัฏฐ์', 'สกาว', 'สมุทร', 'สิปปกร', 'สุริยา',
    'อธิศ', 'อนาวิน', 'อนุสรณ์', 'อภิญญา', 'อรุณ', 'อัษฎา', 'อาโป',
    'อิงครัต', 'อินทัช', 'อิสระ', 'เอื้ออังกูร', 'กวี', 'เขม', 'จรัญ',
    'จิดา', 'ชัช', 'ฐิติ', 'ดล', 'ตฤณ', 'ทิวัตถ์', 'ธนัช',
    'ธีร์', 'นนท์', 'นลิน', 'ปภาวี', 'ปวริศร์', 'ปัณณ์', 'ปาล',
    'พชรพล', 'พรหม', 'พริษฐ์', 'พิธาน', 'พิพัฒน์', 'ภัทร', 'ภาณุ',
    'ภูมิ', 'ภูริ', 'มนต์', 'มานิต', 'รชตะ', 'รณกร', 'วรินทร์',
    'วัชร', 'ศรัณ', 'ศิวัชญ์', 'สิรภพ', 'อคิราห์', 'อนันดา', 'อมร',
  ],
};

export const LAST_NAMES = [
  'สุขสมบูรณ์', 'ใจดี', 'วงศ์สวัสดิ์', 'เจริญกิจ', 'ศรีสุวรรณ', 'บุญมี',
  'รุ่งเรือง', 'ทองคำ', 'ประสิทธิ์', 'จันทร์เพ็ญ', 'วัฒนากูล', 'แซ่ตั้ง',
  'แซ่ลิ้ม', 'เกียรติไกร', 'พูลทรัพย์', 'อินทร์แก้ว', 'ศิริวัฒน์', 'แก้วมณี',
  'กิตติขจร', 'กุลวัฒน์', 'ขำสะอาด', 'คงคา', 'คงสมบูรณ์', 'คำดี',
  'คำมูล', 'จงเจริญ', 'จันทรา', 'จันทร์สว่าง', 'จารุวรรณ', 'จำปา',
  'จิตต์มั่น', 'จิตตเจริญ', 'จินดาวงศ์', 'เจตน์จำนง', 'เจริญสุข', 'ชูเชิด',
  'ชูศรี', 'ไชยชนะ', 'ไชยวงศ์', 'ไชยสิทธิ์', 'ณรงค์ชัย', 'ดำรงค์กุล',
  'ดีพร้อม', 'ตระกูลไทย', 'ตั้งเจริญ', 'เตชะวณิช', 'ถาวรสุข', 'ทรงธรรม',
  'ทรัพย์ไพศาล', 'ทรัพย์มี', 'ทวีทรัพย์', 'ทวีผล', 'ทองดี', 'ทองแท้',
  'ทองใบ', 'ทองสุข', 'ธรรมรักษา', 'ธนากูล', 'นรเศรษฐ์', 'นาคแก้ว',
  'นาคราช', 'นิลกาญจน์', 'นิลเพ็ชร', 'บุญเกิด', 'บุญช่วย', 'บุญนำ',
  'บุญประเสริฐ', 'บุญมา', 'บุญรักษา', 'บุญเลิศ', 'ประเสริฐสุข', 'ปัญญาดี',
  'ปานทอง', 'เปี่ยมสุข', 'พงษ์พานิช', 'พนมวัน', 'พรหมมา', 'พละเดช',
  'พัฒนากุล', 'พิทักษ์กุล', 'พิมลรัตน์', 'พิริยะกุล', 'ไพบูลย์', 'ไพศาลกิจ',
  'ภักดี', 'ภัทรพงศ์', 'ภูริวัฒน์', 'มณีรัตน์', 'มงคลชัย', 'มั่งมี',
  'มีสุข', 'ยงยุทธ', 'ยอดยิ่ง', 'รักษ์ไทย', 'รัตนกุล', 'รัตนมณี',
  'เรืองเดช', 'เรืองฤทธิ์', 'ล้ำเลิศ', 'วงศ์คำ', 'วงศ์ไทย', 'วงศ์สุวรรณ',
  'วัฒนศักดิ์', 'วรรณดี', 'วิเศษกุล', 'ศรีชัย', 'ศรีทอง', 'ศรีบุญเรือง',
  'ศรีสมร', 'ศิริกุล', 'ศิริชัย', 'ศิริโชติ', 'ศิริทรัพย์', 'สกุลไทย',
  'สงวนพงศ์', 'สมบูรณ์สุข', 'สมหวัง', 'สวัสดิ์ดี', 'แสงทอง', 'แสงสว่าง',
  'หงส์ทอง', 'หาญกล้า', 'อินทรา', 'อุดมทรัพย์', 'อุดมสุข', 'อุ่นใจ',
  'เอี่ยมสะอาด', 'แซ่โค้ว', 'แซ่อึ๊ง', 'แซ่เล้า', 'แซ่จู', 'แซ่ห่าน',
];

export const NICKNAMES_MALE = [
  'บาส', 'โจ้', 'ต้น', 'กาย', 'เฟิร์ส', 'ภูมิ', 'เติ้ล', 'บอล',
  'พีท', 'แบงค์', 'เจมส์', 'โอ๊ต', 'กอล์ฟ', 'บิ๊ก', 'แม็ก', 'ต้าร์',
  'ปาล์ม', 'เคน', 'มาร์ค', 'เต้', 'อาร์ม', 'ไนท์', 'ฟลุ๊ค', 'ดิว',
  'ท็อป', 'เอิร์ธ', 'ก้อง', 'ต้อม', 'ตั้ม', 'ตู่', 'โต้ง', 'เบิร์ด',
  'บอย', 'แจ็ค', 'โอม', 'โย', 'จ๊อบ', 'ตั้น', 'ริว', 'เต๋า',
  'เดี่ยว', 'หนุ่ม', 'แมน', 'ชาย', 'ตี๋', 'เฮง', 'เป๊ก', 'บูม',
  'นนท์', 'ฟิวส์', 'โฟล์ค', 'อิคคิว', 'ขุน', 'ทัพ', 'สิงห์', 'เสือ',
  'เหนือ', 'ใต้', 'กล้า', 'เก่ง', 'ชัย', 'วิน', 'ธีร์', 'คริส',
  'ไบรท์', 'แทน', 'ก๊อต', 'อัพ', 'แชมป์', 'เซน', 'เต้ย', 'กัปตัน',
  'เนส', 'โน้ต', 'จูเนียร์', 'ทิม', 'ต๊อบ', 'บอม', 'เปา', 'ปลื้ม',
  'ภู', 'อิน', 'เจเจ', 'คิม', 'โชกุน', 'บู๊', 'จิม', 'แจ๊ค',
  'ต่อ', 'ต๋อง', 'น็อต', 'แบงก์', 'ปิงปอง', 'พอร์ช', 'พีค', 'ม่อน',
  'มิค', 'แมนยู', 'ยอร์ช', 'รัน', 'ลีโอ', 'วินเนอร์', 'สไปรท์', 'หมอก',
  'อ๊อฟ', 'อาร์ต', 'อั๋น', 'อ้น', 'เอ', 'เอ็ม', 'โอนลี่', 'ฮาร์ท',
];

export const NICKNAMES_FEMALE = [
  'น้ำหวาน', 'มิว', 'โบว์', 'ฝ้าย', 'แพร', 'พลอย', 'มายด์', 'ออม',
  'แก้ม', 'ฟ้า', 'มิ้นท์', 'เฟิร์น', 'มุก', 'นุ่น', 'เนย', 'แป้ง',
  'ใบเฟิร์น', 'ใบเตย', 'แตงโม', 'มะปราง', 'มะนาว', 'ส้ม', 'ชมพู่', 'องุ่น',
  'ลิ้นจี่', 'กล้วย', 'กุ้ง', 'ปู', 'ปลา', 'นก', 'ผึ้ง', 'มด',
  'กระแต', 'กวาง', 'ป๊อปปี้', 'จูน', 'เมย์', 'กิ๊ฟ', 'กิ๊บ', 'อาย',
  'อิง', 'อิ๊ง', 'เอิง', 'เอิร์น', 'เอิน', 'อีฟ', 'แอน', 'แอม',
  'อุ้ม', 'เอื้อย', 'อ้อย', 'น้ำฝน', 'น้ำผึ้ง', 'น้ำตาล', 'น้ำชา', 'น้ำอิง',
  'น้ำขิง', 'ไข่มุก', 'หยก', 'ทับทิม', 'บัว', 'มะลิ', 'พิม', 'พีช',
  'เชอร์รี่', 'เบลล์', 'จ๋า', 'จิ๊บ', 'จุ๊บแจง', 'เจี๊ยบ', 'แจน', 'จอย',
  'แจม', 'ดาว', 'เดือน', 'ตาล', 'ตุ๊กตา', 'ตุ๊กติ๊ก', 'นิชา', 'นิ้ง',
  'แพรว', 'แพตตี้', 'แพม', 'ฟาง', 'ฟิล์ม', 'วิว', 'หวาน', 'หวาย',
  'หลิง', 'เหมย', 'หมิว', 'หมวย', 'ออมสิน', 'อลิซ', 'เอวา', 'มิร่า',
  'กะทิ', 'ขนมผิง', 'ข้าวหอม', 'แคท', 'ซินดี้', 'ซูกัส', 'ต้นอ้อ', 'เนเน่',
  'ใบหม่อน', 'ปิ่น', 'เปียโน', 'พลอยใส', 'พริก', 'พะแพง', 'มีน', 'ลูกน้ำ',
  'ลูกปัด', 'ลูกปลา', 'ลูกตาล', 'ลูกหว้า', 'วีวี่', 'ส้มโอ', 'หนูนา', 'ไหม',
];

export const NICKNAMES_UNISEX = [
  'ปอนด์', 'นัท', 'เบนซ์', 'ตังค์', 'บีม', 'พี', 'เจ', 'ไอซ์',
  'ซัน', 'มิน', 'นิว', 'โฟกัส', 'ข้าว', 'ข้าวปั้น', 'ปั้น', 'ต้นข้าว',
  'ทิว', 'เมฆ', 'ตะวัน', 'สายลม', 'ขนม', 'ยิ้ม', 'รัก', 'อุ่น',
  'โชค', 'ปัน', 'โปรด', 'ปูน', 'ปลาย', 'หนึ่ง', 'สอง', 'เก้า',
  'ต้นน้ำ', 'ขิง', 'ปิง', 'ปัง', 'ฟิน', 'เรน', 'พราว', 'โชน',
  'เพลง', 'จีน', 'มาย', 'เปรม', 'เกมส์', 'กรีน', 'ครีม', 'จี',
  'ซีน', 'ตูน', 'ที', 'ธาม', 'นโม', 'บี', 'ข้าวตัง', 'พิ้งค์',
  'มิกซ์', 'โมจิ', 'รุ้ง', 'ลิลลี่', 'วินนี่', 'สกาย', 'สายฟ้า', 'อันดา',
];

export const NICKNAMES_BY_GENDER = {
  male: NICKNAMES_MALE,
  female: NICKNAMES_FEMALE,
  nonbinary: NICKNAMES_UNISEX,
};

export const NICKNAMES = [
  ...NICKNAMES_MALE,
  ...NICKNAMES_FEMALE,
  ...NICKNAMES_UNISEX,
];

export const WEALTH_TIERS: {
  id: FamilyWealthTier;
  label: string;
  weight: number;
  startCashRange: [number, number];
  startDebtRange: [number, number];
  parentJobs: string[];
}[] = [
  {
    id: 'destitute',
    label: 'ยากจนขัดสน',
    weight: 10,
    startCashRange: [300, 2500],
    startDebtRange: [15000, 60000],
    parentJobs: ['รับจ้างรายวัน', 'เก็บของเก่าขาย', 'คนงานก่อสร้าง', 'รับจ้างทำไร่'],
  },
  {
    id: 'working_poor',
    label: 'หาเช้ากินค่ำ',
    weight: 30,
    startCashRange: [1500, 8000],
    startDebtRange: [5000, 45000],
    parentJobs: ['พนักงานโรงงาน', 'แม่ค้าตลาดนัด', 'ขับวินมอเตอร์ไซค์', 'รปภ.', 'พนักงานทำความสะอาด'],
  },
  {
    id: 'lower_middle',
    label: 'ชนชั้นกลางล่าง',
    weight: 32,
    startCashRange: [6000, 25000],
    startDebtRange: [0, 30000],
    parentJobs: ['ขายก๋วยเตี๋ยว', 'ช่างซ่อมรถ', 'พนักงานบัญชี', 'เสมียนร้านค้า', 'ขับแท็กซี่'],
  },
  {
    id: 'middle',
    label: 'ชนชั้นกลาง',
    weight: 19,
    startCashRange: [20000, 90000],
    startDebtRange: [0, 20000],
    parentJobs: ['ข้าราชการครู', 'พยาบาล', 'พนักงานบริษัทเอกชน', 'เจ้าของร้านขายยา', 'วิศวกร'],
  },
  {
    id: 'upper_middle',
    label: 'มีอันจะกิน',
    weight: 7,
    startCashRange: [80000, 350000],
    startDebtRange: [0, 0],
    parentJobs: ['เจ้าของโรงงานขนาดย่อม', 'แพทย์', 'ผู้จัดการธนาคาร', 'ผู้รับเหมาก่อสร้าง'],
  },
  {
    id: 'wealthy',
    label: 'มั่งคั่ง',
    weight: 2,
    startCashRange: [400000, 1500000],
    startDebtRange: [0, 0],
    parentJobs: ['นักธุรกิจอสังหาริมทรัพย์', 'เจ้าของบริษัทนำเข้า-ส่งออก', 'ผู้บริหารระดับสูง'],
  },
];

export const FAMILY_STRUCTURES: { id: FamilyStructure; label: string; weight: number }[] = [
  { id: 'two_parents', label: 'พ่อแม่ครบถ้วน', weight: 62 },
  { id: 'single_parent', label: 'ครอบครัวเลี้ยงเดี่ยว', weight: 23 },
  { id: 'grandparents', label: 'ปู่ย่าตายายเลี้ยงดู', weight: 15 },
];

export const PARENT_EDUCATIONS: { id: ParentEducation; label: string }[] = [
  { id: 'primary', label: 'ประถมศึกษา' },
  { id: 'secondary', label: 'มัธยมศึกษา' },
  { id: 'vocational', label: 'ปวช./ปวส.' },
  { id: 'bachelor', label: 'ปริญญาตรี' },
  { id: 'postgrad', label: 'สูงกว่าปริญญาตรี' },
];

export const TEMPERAMENTS: {
  id: TemperamentId;
  label: string;
  description: string;
  statBias: Partial<Record<RawStatKey, number>>;
}[] = [
  {
    id: 'calm',
    label: 'ใจเย็น สุขุม',
    description: 'รับมือแรงกดดันได้ดี ตัดสินใจช้าแต่มั่นคง',
    statBias: { eq: 8, reliability: 6, wit: 2 },
  },
  {
    id: 'fiery',
    label: 'ใจร้อน เลือดร้อน',
    description: 'กล้าได้กล้าเสีย พูดตรง ระวังปะทะคนง่าย',
    statBias: { strength: 6, charisma: 4, eq: -5 },
  },
  {
    id: 'anxious',
    label: 'ขี้กังวล คิดมาก',
    description: 'รอบคอบ ช่างสังเกต แต่ความเครียดสะสมไว',
    statBias: { memory: 6, reliability: 4, endurance: -4 },
  },
  {
    id: 'optimistic',
    label: 'มองโลกแง่ดี อารมณ์ขัน',
    description: 'เข้ากับคนง่าย ฟื้นตัวจากความผิดหวังได้เร็ว',
    statBias: { charisma: 8, eq: 5, looks: 3 },
  },
  {
    id: 'ambitious',
    label: 'ทะเยอทะยาน กัดไม่ปล่อย',
    description: 'โฟกัสเป้าหมายและความก้าวหน้า ยอมเหนื่อยเพื่อยกระดับชีวิต',
    statBias: { endurance: 7, wit: 5, creativity: 4 },
  },
];

export const EDUCATION_LABELS: Record<EducationLevel, string> = {
  none: 'ไม่ได้เข้าเรียนในระบบ',
  primary: 'ประถมศึกษา',
  lower_secondary: 'มัธยมศึกษาตอนต้น',
  upper_secondary: 'มัธยมศึกษาตอนปลาย',
  vocational: 'ปวช. / ปวส.',
  bachelor: 'ปริญญาตรี',
  master: 'ปริญญาโท',
  doctorate: 'ปริญญาเอก',
};

export const EDUCATION_RANK: Record<EducationLevel, number> = {
  none: 0,
  primary: 1,
  lower_secondary: 2,
  upper_secondary: 3,
  vocational: 4,
  bachelor: 5,
  master: 6,
  doctorate: 7,
};

export interface HousingDefinition {
  id: HousingId;
  name: string;
  monthlyRent: number;
  depositRequired: number;
  minCreditScore: number;
  energyRecoveryPerDay: number;
  stressDeltaPerDay: number;
  statusBonus: number;
  description: string;
}

export const HOUSINGS: Record<HousingId, HousingDefinition> = {
  parents_home: {
    id: 'parents_home',
    name: 'บ้านพ่อแม่ / บ้านญาติ',
    monthlyRent: 1500, // ช่วยค่าน้ำค่าไฟตามสมควร ไม่ฟรี 100%
    depositRequired: 0,
    minCreditScore: 300,
    energyRecoveryPerDay: 14,
    stressDeltaPerDay: 0.4,
    statusBonus: 0,
    description: 'ช่วยจ่ายค่าน้ำไฟเดือนละ 1,500 บาท ประหยัดค่าเช่าแต่มีความอึดอัดทางบ้านบ้าง',
  },
  cheap_room: {
    id: 'cheap_room',
    name: 'ห้องเช่าพัดลมชานเมือง',
    monthlyRent: 3200,
    depositRequired: 6400,
    minCreditScore: 300,
    energyRecoveryPerDay: 12,
    stressDeltaPerDay: 0.8,
    statusBonus: 2,
    description: 'อิสระเต็มที่แต่ห้องแคบ อากาศร้อน และเดินทางเหนื่อยหน่อย',
  },
  townhouse_rent: {
    id: 'townhouse_rent',
    name: 'ทาวน์เฮาส์เช่า / หอพักแอร์',
    monthlyRent: 7500,
    depositRequired: 15000,
    minCreditScore: 520,
    energyRecoveryPerDay: 17,
    stressDeltaPerDay: -0.3,
    statusBonus: 8,
    description: 'พื้นที่กว้างขวาง นอนหลับสบายขึ้น ฟื้นพลังงานได้ดี',
  },
  condo: {
    id: 'condo',
    name: 'คอนโดใกล้รถไฟฟ้า',
    monthlyRent: 15500,
    depositRequired: 31000,
    minCreditScore: 640,
    energyRecoveryPerDay: 22,
    stressDeltaPerDay: -1.0,
    statusBonus: 18,
    description: 'เดินทางสะดวก ฟิตเนสครบ คลายเครียดได้ดี แต่ค่าเช่าหนักหน่วง',
  },
};

export type JobDressCode = 'any' | 'neat' | 'strict_formal' | 'nightlife';

export type JobShift = 'none' | 'day' | 'day_long' | 'split' | 'flex' | 'night';

export type JobGrade = 'entry' | 'mid';

export interface JobDefinition {
  id: string;
  title: string;
  category: 'study' | 'parttime' | 'labor' | 'office' | 'skilled' | 'business';
  sceneId: string;
  shift: JobShift;
  defaultWorkShift?: 'morning-afternoon' | 'afternoon-evening' | 'night-morning' | 'flexible';
  weekendOff: boolean;
  allowsOvertime?: boolean;
  jobGrade?: JobGrade;
  relatedSkills: SkillKey[];
  minAge: number;
  maxAge?: number;
  minEducation: EducationLevel;
  minCompetence: number;
  minSkill?: Partial<Record<SkillKey, number>>;
  minRawStats?: Partial<Record<RawStatKey, number>>;
  dressCode?: JobDressCode;
  appearanceNoteTh?: string;
  monthlySalary: number;
  maxSalaryCap: number;
  energyCostPerDay: number;
  stressCostPerDay: number;
  workHoursPerDay: number;
  statusBonus: number;
  skillGrowthPerDay: Partial<Record<SkillKey, number>>;
  description: string;
}

export const JOBS: Record<string, JobDefinition> = {
  infant: {
    id: 'infant',
    title: 'วัยทารก / เตรียมอนุบาล',
    category: 'study',
    sceneId: 'home',
    shift: 'none',
    defaultWorkShift: 'flexible',
    weekendOff: false,
    allowsOvertime: false,
    jobGrade: 'entry',
    relatedSkills: [],
    minAge: 0,
    maxAge: 5,
    minEducation: 'none',
    minCompetence: 0,
    monthlySalary: 0,
    maxSalaryCap: 0,
    energyCostPerDay: 4,
    stressCostPerDay: 0.2,
    workHoursPerDay: 0,
    statusBonus: 0,
    skillGrowthPerDay: {},
    description: 'กิน นอน ร้องไห้ และเรียนรู้โลกใบใหม่ภายใต้การดูแลของครอบครัว',
  },
  student: {
    id: 'student',
    title: 'นักเรียน / นักศึกษา',
    category: 'study',
    sceneId: 'school',
    shift: 'day',
    defaultWorkShift: 'morning-afternoon',
    weekendOff: true,
    allowsOvertime: false,
    jobGrade: 'entry',
    relatedSkills: ['academic', 'english'],
    minAge: 6,
    maxAge: 24,
    minEducation: 'none',
    minCompetence: 0,
    monthlySalary: 0,
    maxSalaryCap: 0,
    energyCostPerDay: 8,
    stressCostPerDay: 1.2,
    workHoursPerDay: 6,
    statusBonus: 2,
    skillGrowthPerDay: { academic: 0.08, english: 0.04 },
    description: 'โฟกัสการเรียน ไม่มีเงินเดือนประจำ ต้องอาศัยเงินครอบครัวหรือรับงานพาร์ตไทม์',
  },
  unemployed: {
    id: 'unemployed',
    title: 'ว่างงาน / พักหางาน',
    category: 'parttime',
    sceneId: 'home',
    shift: 'none',
    defaultWorkShift: 'flexible',
    weekendOff: false,
    allowsOvertime: false,
    jobGrade: 'entry',
    relatedSkills: [],
    minAge: 15,
    minEducation: 'none',
    minCompetence: 0,
    monthlySalary: 0,
    maxSalaryCap: 0,
    energyCostPerDay: 2,
    stressCostPerDay: 1.5,
    workHoursPerDay: 0,
    statusBonus: -4,
    skillGrowthPerDay: {},
    description: 'ไม่มีรายได้ประจำ แต่มีเวลาว่างเต็มที่ในการฝึกทักษะหรือหางานใหม่',
  },
  convenience_staff: {
    id: 'convenience_staff',
    title: 'พนักงานร้านสะดวกซื้อ',
    category: 'parttime',
    sceneId: 'shop_minimart',
    shift: 'split',
    defaultWorkShift: 'afternoon-evening',
    weekendOff: false,
    allowsOvertime: true,
    jobGrade: 'entry',
    relatedSkills: ['sales', 'socializing'],
    minAge: 16,
    minEducation: 'lower_secondary',
    minCompetence: 15,
    monthlySalary: 11500,
    maxSalaryCap: 15500,
    energyCostPerDay: 11,
    stressCostPerDay: 2.0,
    workHoursPerDay: 8,
    statusBonus: 4,
    skillGrowthPerDay: { sales: 0.05, socializing: 0.04 },
    description: 'งานกะยืนทั้งวัน เงินเดือนเริ่มต้นพอประทังชีวิต ได้ฝึกความอดทนและรับมือลูกค้า',
  },
  food_rider: {
    id: 'food_rider',
    title: 'ไรเดอร์ส่งอาหาร',
    category: 'labor',
    sceneId: 'street_shops',
    shift: 'flex',
    defaultWorkShift: 'flexible',
    weekendOff: false,
    allowsOvertime: true,
    jobGrade: 'entry',
    relatedSkills: ['craft', 'finance'],
    minAge: 18,
    minEducation: 'primary',
    minCompetence: 20,
    monthlySalary: 15000,
    maxSalaryCap: 24000,
    energyCostPerDay: 14,
    stressCostPerDay: 2.4,
    workHoursPerDay: 9,
    statusBonus: 5,
    skillGrowthPerDay: { craft: 0.03, finance: 0.03 },
    description: 'รายได้ขึ้นกับความขยันและสภาพอากาศ เสี่ยงอุบัติเหตุบนท้องถนนและกินแรงกายสูง',
  },
  office_junior: {
    id: 'office_junior',
    title: 'พนักงานออฟฟิศเริ่มต้น',
    category: 'office',
    sceneId: 'work_corporate',
    shift: 'day',
    defaultWorkShift: 'morning-afternoon',
    weekendOff: true,
    allowsOvertime: true,
    jobGrade: 'entry',
    relatedSkills: ['tech', 'english', 'socializing'],
    minAge: 20,
    minEducation: 'bachelor',
    minCompetence: 35,
    dressCode: 'neat',
    appearanceNoteTh: 'องค์กรทั่วไปชอบบุคลิกสุภาพ หากผมสีแฟชั่นจัดหรือลุคจัดจ้าน ความน่าเชื่อถือช่วงแรกอาจลดลงเล็กน้อย',
    monthlySalary: 18500,
    maxSalaryCap: 28000,
    energyCostPerDay: 10,
    stressCostPerDay: 2.3,
    workHoursPerDay: 8,
    statusBonus: 12,
    skillGrowthPerDay: { tech: 0.05, english: 0.04, socializing: 0.04 },
    description: 'งานประจำห้องแอร์ เงินเดือนสตาร์ตมาตรฐานไทย มีโอกาสเติบโตในสายงานองค์กร',
  },
  technician: {
    id: 'technician',
    title: 'ช่างเทคนิค / ซ่อมบำรุง',
    category: 'skilled',
    sceneId: 'work_warehouse',
    shift: 'day',
    defaultWorkShift: 'morning-afternoon',
    weekendOff: true,
    allowsOvertime: true,
    jobGrade: 'entry',
    relatedSkills: ['craft', 'tech'],
    minAge: 19,
    minEducation: 'vocational',
    minCompetence: 32,
    minSkill: { craft: 15 },
    monthlySalary: 19500,
    maxSalaryCap: 34000,
    energyCostPerDay: 13,
    stressCostPerDay: 1.9,
    workHoursPerDay: 8,
    statusBonus: 10,
    skillGrowthPerDay: { craft: 0.09, tech: 0.03 },
    description: 'อาศัยฝีมือเฉพาะทาง รายได้ดีกว่ารายได้ขั้นต่ำมากและมีงานรองรับตลอด',
  },
  sales_exec: {
    id: 'sales_exec',
    title: 'พนักงานขาย / เซลส์',
    category: 'office',
    sceneId: 'work_corporate',
    shift: 'flex',
    defaultWorkShift: 'flexible',
    weekendOff: true,
    allowsOvertime: true,
    jobGrade: 'entry',
    relatedSkills: ['sales', 'socializing'],
    minAge: 20,
    minEducation: 'upper_secondary',
    minCompetence: 38,
    minSkill: { sales: 18 },
    minRawStats: { charisma: 45, looks: 35 },
    dressCode: 'neat',
    appearanceNoteTh: 'งานขายต้องอาศัยเสน่ห์การพูดและบุคลิกภายนอกที่สร้างความไว้ใจให้ลูกค้าได้',
    monthlySalary: 23000,
    maxSalaryCap: 45000,
    energyCostPerDay: 12,
    stressCostPerDay: 2.8,
    workHoursPerDay: 9,
    statusBonus: 14,
    skillGrowthPerDay: { sales: 0.09, socializing: 0.07 },
    description: 'กดดันตามยอดขาย แต่ถ้ารู้จักปิดดีลและพูดเก่ง รายได้รวมคอมมิชชันพุ่งไว',
  },
  civil_servant: {
    id: 'civil_servant',
    title: 'ข้าราชการระดับปฏิบัติการ',
    category: 'office',
    sceneId: 'work_corporate',
    shift: 'day',
    defaultWorkShift: 'morning-afternoon',
    weekendOff: true,
    allowsOvertime: false,
    jobGrade: 'entry',
    relatedSkills: ['academic', 'finance'],
    minAge: 22,
    minEducation: 'bachelor',
    minCompetence: 46,
    minSkill: { academic: 20 },
    minRawStats: { reliability: 45 },
    dressCode: 'strict_formal',
    appearanceNoteTh: 'สายงานราชการเคร่งครัดเรื่องความน่าเชื่อถือ การแต่งกายสุภาพ และงดผมย้อมสีแฟชั่นฉูดฉาด',
    monthlySalary: 18000,
    maxSalaryCap: 42000,
    energyCostPerDay: 9,
    stressCostPerDay: 1.6,
    workHoursPerDay: 8,
    statusBonus: 20,
    skillGrowthPerDay: { academic: 0.05, finance: 0.04 },
    description: 'เงินเดือนเริ่มต้นไม่สูงมาก แต่ความมั่นคงและเครดิตทางสังคมดีเยี่ยม',
  },
  software_dev: {
    id: 'software_dev',
    title: 'นักพัฒนาซอฟต์แวร์',
    category: 'skilled',
    sceneId: 'work_corporate',
    shift: 'day',
    defaultWorkShift: 'morning-afternoon',
    weekendOff: true,
    allowsOvertime: true,
    jobGrade: 'mid',
    relatedSkills: ['tech', 'english', 'academic'],
    minAge: 21,
    minEducation: 'bachelor',
    minCompetence: 52,
    minSkill: { tech: 35, english: 25 },
    monthlySalary: 38000,
    maxSalaryCap: 95000,
    energyCostPerDay: 12,
    stressCostPerDay: 2.7,
    workHoursPerDay: 9,
    statusBonus: 22,
    skillGrowthPerDay: { tech: 0.12, english: 0.06 },
    description: 'ค่าตอบแทนสูงตามความสามารถทางเทคนิค แลกกับเดดไลน์และความล้าทางสมอง',
  },
  small_business: {
    id: 'small_business',
    title: 'เจ้าของร้านอาหาร / ค้าขายอิสระ',
    category: 'business',
    sceneId: 'restaurant_tamsang',
    shift: 'day_long',
    defaultWorkShift: 'morning-afternoon',
    weekendOff: false,
    allowsOvertime: true,
    jobGrade: 'mid',
    relatedSkills: ['cooking', 'finance', 'sales'],
    minAge: 21,
    minEducation: 'primary',
    minCompetence: 42,
    minSkill: { cooking: 25, finance: 20 },
    monthlySalary: 29000,
    maxSalaryCap: 75000,
    energyCostPerDay: 15,
    stressCostPerDay: 2.9,
    workHoursPerDay: 10,
    statusBonus: 18,
    skillGrowthPerDay: { cooking: 0.08, finance: 0.08, sales: 0.05 },
    description: 'เป็นนายตัวเองเต็มตัว กำไรดีถ้าคุมต้นทุนเป็น แต่เหนื่อยแทบไม่ได้หยุด',
  },
  sales_manager: {
    id: 'sales_manager',
    title: 'ผู้จัดการฝ่ายขาย',
    category: 'office',
    sceneId: 'work_corporate',
    shift: 'day',
    defaultWorkShift: 'morning-afternoon',
    weekendOff: true,
    allowsOvertime: true,
    jobGrade: 'mid',
    relatedSkills: ['sales', 'finance', 'socializing'],
    minAge: 27,
    minEducation: 'bachelor',
    minCompetence: 62,
    minSkill: { sales: 45, socializing: 35 },
    minRawStats: { charisma: 58, reliability: 48 },
    dressCode: 'neat',
    appearanceNoteTh: 'ระดับผู้บริหารต้องใช้เสน่ห์โน้มน้าวสูงและภาพลักษณ์ที่น่าเชื่อถือต่อทีมและลูกค้า',
    monthlySalary: 55000,
    maxSalaryCap: 110000,
    energyCostPerDay: 13,
    stressCostPerDay: 3.2,
    workHoursPerDay: 9,
    statusBonus: 30,
    skillGrowthPerDay: { sales: 0.07, finance: 0.06, socializing: 0.06 },
    description: 'คุมทีมและรับผิดชอบเป้ายอดขายหลัก ความเครียดสูงแต่รายได้และสถานะก้าวกระโดด',
  },
};

export const WORK_SHIFT_LABELS_TH: Record<
  'morning-afternoon' | 'afternoon-evening' | 'night-morning' | 'flexible',
  string
> = {
  'morning-afternoon': 'กะกลางวัน (เช้า–บ่าย)',
  'afternoon-evening': 'กะบ่าย (บ่าย–เย็น)',
  'night-morning': 'กะดึก (ดึก–เช้า)',
  flexible: 'เวลาทำงานยืดหยุ่น',
};

export function createEmploymentForJob(
  jobId: string,
  workShiftOverride?: 'morning-afternoon' | 'afternoon-evening' | 'night-morning' | 'flexible',
  prev?: { overtimeStreakWeeks?: number; shiftFamilyRelOffset?: number }
): {
  status: 'none' | 'student' | 'employed';
  jobId: string;
  workShift: 'morning-afternoon' | 'afternoon-evening' | 'night-morning' | 'flexible';
  allowsOvertime: boolean;
  contractHoursPerWeek: number;
  overtimeStreakWeeks: number;
  shiftFamilyRelOffset?: number;
} {
  const job = JOBS[jobId] ?? JOBS.unemployed;
  if (job.id === 'infant' || job.id === 'unemployed' || job.shift === 'none') {
    return {
      status: 'none',
      jobId: job.id,
      workShift: workShiftOverride ?? job.defaultWorkShift ?? 'morning-afternoon',
      allowsOvertime: false,
      contractHoursPerWeek: 0,
      overtimeStreakWeeks: 0,
      shiftFamilyRelOffset: prev?.shiftFamilyRelOffset ?? 0,
    };
  }
  if (job.id === 'student') {
    return {
      status: 'student',
      jobId: 'student',
      workShift: 'morning-afternoon',
      allowsOvertime: false,
      contractHoursPerWeek: job.workHoursPerDay * 5,
      overtimeStreakWeeks: 0,
      shiftFamilyRelOffset: prev?.shiftFamilyRelOffset ?? 0,
    };
  }
  return {
    status: 'employed',
    jobId: job.id,
    workShift: workShiftOverride ?? job.defaultWorkShift ?? 'morning-afternoon',
    allowsOvertime: job.allowsOvertime !== false,
    contractHoursPerWeek: job.workHoursPerDay * (job.weekendOff ? 5 : 6),
    overtimeStreakWeeks: prev?.overtimeStreakWeeks ?? 0,
    shiftFamilyRelOffset: prev?.shiftFamilyRelOffset ?? 0,
  };
}

let hasValidatedJobsSchedule = false;
export function validateJobsScheduleInDev(): void {
  if (hasValidatedJobsSchedule) return;
  hasValidatedJobsSchedule = true;
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    for (const [key, job] of Object.entries(JOBS)) {
      if (!job.sceneId || !job.shift || typeof job.weekendOff !== 'boolean') {
        console.warn(
          `[JOBS] Job "${key}" is missing required schedule metadata (sceneId, shift, weekendOff).`
        );
      }
    }
  }
}

export interface RoutineDefinition {
  id: RoutineFocus;
  label: string;
  description: string;
  energyDelta: number;
  stressDelta: number;
  freeTimeHours: number;
  dailySideIncome: number;
  skillBonus: number;
}

export const ROUTINES: Record<RoutineFocus, RoutineDefinition> = {
  balanced: {
    id: 'balanced',
    label: 'สมดุล',
    description: 'ใช้ชีวิตตามปกติ พักผ่อนพอดี มีเวลาส่วนตัวเล็กน้อย',
    energyDelta: 0,
    stressDelta: -0.4,
    freeTimeHours: 4,
    dailySideIncome: 0,
    skillBonus: 0.03,
  },
  hustle: {
    id: 'hustle',
    label: 'โหมงานหนัก / โอที',
    description: 'เร่งทำผลงานและรับโอที ได้เงินเสริมเล็กน้อยแต่กินแรงและเครียดสะสม',
    energyDelta: -4,
    stressDelta: 1.6,
    freeTimeHours: 1.5,
    dailySideIncome: 180, // มีเพดานชัดเจน ต้องใช้พลังงาน
    skillBonus: 0.05,
  },
  study: {
    id: 'study',
    label: 'ซุ่มฝึกทักษะ',
    description: 'ใช้เวลาว่างหลังเลิกงานพัฒนาทักษะเฉพาะทาง เตรียมอัปเกรดอาชีพ',
    energyDelta: -2.5,
    stressDelta: 0.6,
    freeTimeHours: 2,
    dailySideIncome: 0,
    skillBonus: 0.14,
  },
  rest: {
    id: 'rest',
    label: 'เน้นพักผ่อนฟื้นฟู',
    description: 'นอนเร็ว ดูแลสุขภาพ ลดความเครียดสะสม',
    energyDelta: 5,
    stressDelta: -2.2,
    freeTimeHours: 5.5,
    dailySideIncome: 0,
    skillBonus: 0.01,
  },
  side_gig: {
    id: 'side_gig',
    label: 'รับจ๊อบเสริมหลังเลิกงาน',
    description: 'ขายของออนไลน์/รับงานนอก หารายได้เสริมรายวัน แลกเวลาว่างและพลังงาน',
    energyDelta: -3.5,
    stressDelta: 1.1,
    freeTimeHours: 1.5,
    dailySideIncome: 260,
    skillBonus: 0.04,
  },
};

export const RAW_STAT_LABELS: Record<RawStatKey, { label: string; description: string }> = {
  looks: { label: 'รูปลักษณ์/เสน่ห์', description: 'บุคลิกภายนอกและการดูแลตัวเอง' },
  strength: { label: 'ความแข็งแรง', description: 'พละกำลังทางกายภาพ' },
  endurance: { label: 'ความอึด', description: 'ความทนทานต่อความเหนื่อยล้าและโรคภัย' },
  wit: { label: 'ไหวพริบ', description: 'การแก้ปัญหาเฉพาะหน้าและความเร็วทางความคิด' },
  memory: { label: 'ความจำ', description: 'การจดจำและเรียนรู้เนื้อหาซับซ้อน' },
  creativity: { label: 'ความคิดสร้างสรรค์', description: 'ไอเดียใหม่และการต่อยอดทางเลือก' },
  eq: { label: 'EQ (วุฒิภาวะอารมณ์)', description: 'การคุมสติและเข้าใจอารมณ์ตนเอง/ผู้อื่น' },
  charisma: { label: 'เสน่ห์การพูด', description: 'การโน้มน้าวใจและสร้างบรรยากาศ' },
  reliability: { label: 'ความน่าเชื่อถือ', description: 'ความรับผิดชอบและเครดิตในสายตาคนอื่น' },
};

export type RawStatGroupKey = 'physical' | 'mental' | 'social';

export interface RawStatDetailMeta {
  key: RawStatKey;
  group: RawStatGroupKey;
  groupLabelTh: string;
  label: string;
  shortDesc: string;
  indicesSupported: string[];
  skillsAccelerated: string[];
  lifestyleBoosts: string[];
  lifestyleDrains: string[];
}

export const RAW_STAT_GROUPS: Array<{
  key: RawStatGroupKey;
  labelTh: string;
  descTh: string;
  keys: RawStatKey[];
}> = [
  {
    key: 'physical',
    labelTh: 'กายภาพ',
    descTh: 'สุขภาพ รูปร่าง และความทนทานของร่างกาย',
    keys: ['looks', 'strength', 'endurance'],
  },
  {
    key: 'mental',
    labelTh: 'สมองและงาน',
    descTh: 'สติปัญญา ความจำ และความคิดสร้างสรรค์',
    keys: ['wit', 'memory', 'creativity'],
  },
  {
    key: 'social',
    labelTh: 'ใจและผู้คน',
    descTh: 'วุฒิภาวะทางอารมณ์ เสน่ห์ และความน่าเชื่อถือ',
    keys: ['eq', 'charisma', 'reliability'],
  },
];

export const RAW_STAT_DETAILS: Record<RawStatKey, RawStatDetailMeta> = {
  looks: {
    key: 'looks',
    group: 'physical',
    groupLabelTh: 'กายภาพ',
    label: 'รูปโฉม/การดูแลตัวเอง',
    shortDesc: 'บุคลิกภายนอก ผิวพรรณ และการดูแลตัวเอง',
    indicesSupported: ['ดัชนีสังคม (เสริม +20%)', 'ภาพลักษณ์งานทางการ (ความน่าเชื่อถือ)'],
    skillsAccelerated: ['การเข้าสังคม', 'การเจรจา/ขาย'],
    lifestyleBoosts: ['นอนเต็มอิ่ม (ฟื้นฟูเซลล์และผิวพรรณ)', 'แต่งกาย/ดูแลตัวเอง', 'เติบโตตามวัยหนุ่มสาว'],
    lifestyleDrains: ['อายุ 60 ปีขึ้นไป (ริ้วรอยตามวัย)', 'อดนอนเรื้อรัง', 'ความเครียดสะสม'],
  },
  strength: {
    key: 'strength',
    group: 'physical',
    groupLabelTh: 'กายภาพ',
    label: 'ความแข็งแรง',
    shortDesc: 'พละกำลัง กล้ามเนื้อ และสมรรถภาพทางกาย',
    indicesSupported: ['ดัชนีร่างกาย (หลัก +32%)'],
    skillsAccelerated: ['งานช่าง/ฝีมือ (ตัวคูณเรียนรู้เร็วขึ้น)'],
    lifestyleBoosts: ['ออกกำลังกายสม่ำเสมอในตารางชีวิต', 'เติบโตตามวัยเด็กจนถึงหนุ่มสาว'],
    lifestyleDrains: ['อายุ 45 ปีขึ้นไป (พละกำลังถดถอย)', 'ไม่ค่อยขยับร่างกาย'],
  },
  endurance: {
    key: 'endurance',
    group: 'physical',
    groupLabelTh: 'กายภาพ',
    label: 'ความอึดและความทนทาน',
    shortDesc: 'ความทนทานต่อความเหนื่อยล้า โรคภัย และงานหนัก',
    indicesSupported: ['ดัชนีร่างกาย (หลัก +32%)', 'เพดานความทนทานต่อภาระงาน'],
    skillsAccelerated: ['งานช่าง/ฝีมือ', 'ทำอาหาร/ค้าขาย'],
    lifestyleBoosts: ['ออกกำลังกายในตารางชีวิต', 'นอนเต็มอิ่มช่วยฟื้นฟู', 'เติบโตตามวัยช่วง 0-24 ปี'],
    lifestyleDrains: ['ทำงานเกินเกณฑ์ (Overwork)', 'อดนอนสะสม', 'อายุ 45 ปีขึ้นไป'],
  },
  wit: {
    key: 'wit',
    group: 'mental',
    groupLabelTh: 'สมองและงาน',
    label: 'ไหวพริบ',
    shortDesc: 'การแก้ปัญหาเฉพาะหน้าและความเร็วทางความคิด',
    indicesSupported: ['ดัชนีความสามารถ (หลัก +26%)'],
    skillsAccelerated: ['วิชาการ', 'เทคโนโลยี/คอมพิวเตอร์', 'การจัดการเงิน', 'ภาษาอังกฤษ'],
    lifestyleBoosts: ['อ่านหนังสือ/ฝึกฝนตนเอง (self_study)', 'ลงคอร์สอบรม', 'เติบโตตามวัยเรียนรู้'],
    lifestyleDrains: ['สมองล้าจากการพักผ่อนไม่พอ', 'อายุ 65 ปีขึ้นไป'],
  },
  memory: {
    key: 'memory',
    group: 'mental',
    groupLabelTh: 'สมองและงาน',
    label: 'ความจำ',
    shortDesc: 'การจดจำและเรียนรู้เนื้อหาที่ซับซ้อน',
    indicesSupported: ['ดัชนีความสามารถ (เสริม +20%)'],
    skillsAccelerated: ['ภาษาอังกฤษ', 'วิชาการ'],
    lifestyleBoosts: ['ทบทวนตำรา/ฝึกทักษะด้วยตนเอง', 'นอนหลับเต็มอิ่มช่วยจัดระเบียบสมอง'],
    lifestyleDrains: ['อดนอนสะสม', 'อายุ 60 ปีขึ้นไปตามธรรมชาติ'],
  },
  creativity: {
    key: 'creativity',
    group: 'mental',
    groupLabelTh: 'สมองและงาน',
    label: 'ความคิดสร้างสรรค์',
    shortDesc: 'การคิดนอกกรอบ ไอเดียใหม่ และการต่อยอดงาน',
    indicesSupported: ['ดัชนีความสามารถ (เสริม +18%)'],
    skillsAccelerated: ['เทคโนโลยี/ออกแบบ', 'ทำอาหาร/ค้าขาย'],
    lifestyleBoosts: ['ทำงานอดิเรกสร้างสรรค์', 'กิจกรรมศิลปะ/ดนตรี', 'เปิดรับประสบการณ์ใหม่'],
    lifestyleDrains: ['ชีวิตตึงเครียดซ้ำซาก ขาดเวลาว่าง'],
  },
  eq: {
    key: 'eq',
    group: 'social',
    groupLabelTh: 'ใจและผู้คน',
    label: 'วุฒิภาวะทางอารมณ์ (EQ)',
    shortDesc: 'การคุมสติ เข้าใจอารมณ์ตนเอง และเห็นอกเห็นใจผู้อื่น',
    indicesSupported: ['ดัชนีจิตใจ (หลัก +55%)'],
    skillsAccelerated: ['การเจรจา/ขาย', 'การเข้าสังคม'],
    lifestyleBoosts: ['เวลาคุณภาพกับครอบครัว', 'พักผ่อนสงบจิตใจ', 'ประสบการณ์ชีวิตที่ผ่านอุปสรรค'],
    lifestyleDrains: ['ความเครียดสะสมเรื้อรัง (Burnout)', 'สภาพแวดล้อมเป็นพิษ'],
  },
  charisma: {
    key: 'charisma',
    group: 'social',
    groupLabelTh: 'ใจและผู้คน',
    label: 'เสน่ห์การพูดและเข้าหาคน',
    shortDesc: 'การโน้มน้าวใจ บุคลิกน่าคบหา และการสร้างบรรยากาศ',
    indicesSupported: ['ดัชนีสังคม (หลัก +34%)'],
    skillsAccelerated: ['การเจรจา/ขาย', 'การเข้าสังคม'],
    lifestyleBoosts: ['พบปะเพื่อนฝูงเข้าสังคม', 'ทำกิจกรรมกลุ่ม', 'แลกเปลี่ยนพูดคุยกับผู้คน'],
    lifestyleDrains: ['การแยกตัวโดดเดี่ยวยาวนาน', 'ความมั่นใจถดถอยจากภาวะเครียด'],
  },
  reliability: {
    key: 'reliability',
    group: 'social',
    groupLabelTh: 'ใจและผู้คน',
    label: 'ความน่าเชื่อถือและความรับผิดชอบ',
    shortDesc: 'ความรับผิดชอบในหน้าที่ สัจจะ และเครดิตในสายตาคนรอบข้าง',
    indicesSupported: ['ดัชนีจิตใจ (+20%)', 'ดัชนีสังคม (+22%)', 'ดัชนีสถานะ (+18%)', 'ดัชนีความสามารถ (+14%)'],
    skillsAccelerated: ['การจัดการเงิน', 'หน้าที่การงานทุกสาขา'],
    lifestyleBoosts: ['ทำงานตามหน้าที่สม่ำเสมอ', 'รักษาสัญญาและตรงต่อเวลา', 'สั่งสมความน่าเชื่อถือตามวัย'],
    lifestyleDrains: ['ละเลยหน้าที่ความรับผิดชอบ', 'มีหนี้สินค้างชำระ', 'พฤติกรรมเสี่ยงผิดวินัย'],
  },
};

export const SKILL_LABELS: Record<SkillKey, { label: string; description: string }> = {
  english: { label: 'ภาษาอังกฤษ', description: 'ช่วยปลดล็อกงานสายเทคและองค์กรใหญ่' },
  sales: { label: 'การเจรจา/ขาย', description: 'เพิ่มโอกาสงานขายและรายได้เสริม' },
  finance: { label: 'การจัดการเงิน', description: 'ช่วยบริหารหนี้และต่อยอดธุรกิจ' },
  tech: { label: 'เทคโนโลยี/คอมพิวเตอร์', description: 'ทักษะดิจิทัลและงานซอฟต์แวร์' },
  craft: { label: 'งานช่าง/ฝีมือ', description: 'งานซ่อมบำรุงและทักษะปฏิบัติ' },
  cooking: { label: 'ทำอาหาร/ค้าขาย', description: 'ต่อยอดร้านอาหารและอาชีพปากท้อง' },
  socializing: { label: 'การเข้าสังคม', description: 'สร้างคอนเนกชันและรับมือความสัมพันธ์' },
  academic: { label: 'วิชาการ', description: 'ช่วยด้านการสอบ การเรียน และงานราชการ' },
};

export const LIFE_INDEX_LABELS: Record<LifeIndexKey, { label: string; shortDesc: string }> = {
  physical: { label: 'กาย', shortDesc: 'สุขภาพ พลังงาน และความแข็งแรงของร่างกาย' },
  mental: { label: 'ใจ', shortDesc: 'สมดุลอารมณ์ EQ และแรงกดดันจากความเครียด' },
  financial: { label: 'เงิน', shortDesc: 'สภาพคล่อง รายได้สุทธิ และภาระหนี้สิน' },
  social: { label: 'สัมพันธ์', shortDesc: 'เสน่ห์การพูด ความน่าเชื่อถือ และทักษะสังคม' },
  status: { label: 'สถานะ', shortDesc: 'อาชีพ ที่อยู่อาศัย การศึกษา และเครดิตทางสังคม' },
  competence: { label: 'ความสามารถ', shortDesc: 'สติปัญญา ไหวพริบ และทักษะสะสมทั้งหมด' },
};

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export const THAI_WEEKDAYS = [
  'อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์',
];

export const DEMO_PROMPTS: PendingEventPrompt[] = [
  {
    id: 'demo_relative_borrow',
    title: 'ญาติสนิททักไลน์มายืมเงินด่วน',
    category: 'dilemma',
    description:
      'จู่ๆ น้าแท้ๆ ที่ไม่ค่อยได้คุยกันส่งข้อความมาพร้อมรูปสลิปค่ารักษาพยาบาล บอกว่า "ขอหยิบยืมสัก 4,500 บาท เดี๋ยวสิ้นเดือนหน้าโอนคืนให้แน่นอน" ในใจคุณรู้ดีว่าญาติคนนี้เคยเบี้ยวหนี้คนในบ้านมาแล้วสองรอบ',
    choices: [
      {
        id: 'lend_money',
        label: 'โอนให้ยืม 4,500 บาท ตัดความรำคาญ',
        hint: 'เสียเงินสดทันที และจะมีผลตามมาในอีก 30 วัน (Echo)',
        effects: [
          { type: 'AddMoney', amount: -4500, category: 'event', reason: 'ให้น้ายืมเงินฉุกเฉิน' },
          { type: 'ChangeRawStat', stat: 'reliability', delta: 2, reason: 'ยอมช่วยเหลือญาติ' },
          {
            type: 'ScheduleEcho',
            delayDays: 30,
            title: 'ครบกำหนดที่น้านัดคืนเงิน',
            description: 'ผ่านไปหนึ่งเดือนเต็ม คุณทักไลน์ไปทวงเงิน 4,500 บาท... ผลปรากฏว่าน้าอ่านไม่ตอบและตั้งสเตตัสไปเที่ยวต่างจังหวัดแทน',
            effects: [
              { type: 'ChangeResource', resource: 'stress', delta: 12, reason: 'โดนญาติเบี้ยวหนี้ตามคาด' },
              { type: 'ChangeRawStat', stat: 'eq', delta: 2, reason: 'บทเรียนราคาแพงเรื่องคนใกล้ตัว' },
            ],
            sourceEventId: 'demo_relative_borrow',
          },
        ],
      },
      {
        id: 'refuse_politely',
        label: 'ปฏิเสธอ้อมๆ ว่าเดือนนี้ช็อตเหมือนกัน',
        hint: 'รักษาเงินสดไว้ได้ แต่อาจโดนเอาไปนินทาในกลุ่มไลน์ครอบครัว',
        effects: [
          { type: 'ChangeResource', resource: 'stress', delta: 4, reason: 'อึดอัดที่ต้องปฏิเสธญาติ' },
          { type: 'ChangeRawStat', stat: 'eq', delta: 2, reason: 'กล้าตั้งขอบเขตทางการเงิน' },
          {
            type: 'ScheduleEcho',
            delayDays: 14,
            title: 'เสียงซุบซิบในกลุ่มญาติ',
            description: 'แม่โทรมาบ่นว่าน้าเอาไปพูดทั่วว่าคุณขี้งก ทั้งที่คุณก็แค่เอาตัวรอดในยุคข้าวยากหมากแพง',
            effects: [
              { type: 'ChangeResource', resource: 'stress', delta: 5, reason: 'โดนญาติกดดันทางอ้อม' },
            ],
            sourceEventId: 'demo_relative_borrow',
          },
        ],
      },
      {
        id: 'adult_underground_tip',
        label: 'ไม่ให้ยืม แต่ชวนน้าไปเล่นวงแชร์/หวยใต้ดินแก้ขัดด้วยกัน',
        hint: 'เฉพาะตัวละครอายุ 18 ปีขึ้นไป: เสี่ยงดวงแบบไทยๆ',
        requiresAdult: true,
        effects: [
          { type: 'AddMoney', amount: -1500, category: 'event', reason: 'ลงขันเสี่ยงโชคกับน้า' },
          { type: 'ChangeResource', resource: 'stress', delta: -3, reason: 'ลุ้นเลขเด็ดพอให้กระชุ่มกระชวย' },
          {
            type: 'ScheduleEcho',
            delayDays: 15,
            title: 'วันหวยออกกับความฝันที่เกือบเป็นจริง',
            description: 'เลขเฉียดไปแค่ตัวเดียว! เงิน 1,500 บาทหายไปกับสายลม แต่คุณกับน้ากลับสนิทกันเฉยเลย',
            effects: [
              { type: 'ChangeRawStat', stat: 'charisma', delta: 2, reason: 'คุยถูกคอกับสายเสี่ยงโชค' },
            ],
            sourceEventId: 'demo_relative_borrow',
          },
        ],
      },
    ],
  },
  {
    id: 'demo_health_check',
    title: 'สัญญาณเตือนจากร่างกายในวันที่พักผ่อนน้อย',
    category: 'health',
    description:
      'เช้านี้คุณตื่นมาพร้อมอาการหน้ามืดและปวดตึงต้นคอ หลังลุยชีวิตหนักมาหลายวัน เพื่อนร่วมรุ่นทักว่าหน้าตาดูอิดโรยผิดปกติ จะจัดการวันนี้ยังไงดี?',
    choices: [
      {
        id: 'go_clinic',
        label: 'ลางานไปคลินิก ตรวจร่างกายและซื้อวิตามิน (1,200 บาท)',
        hint: 'เสียเงินเล็กน้อย แต่ฟื้นพลังงานและลดความเสี่ยงระยะยาว',
        effects: [
          { type: 'AddMoney', amount: -1200, category: 'living', reason: 'ค่าคลินิกและยาบำรุง' },
          { type: 'ChangeResource', resource: 'energy', delta: 22, reason: 'ได้พักและรักษาตัวทันท่วงที' },
          { type: 'ChangeResource', resource: 'stress', delta: -10, reason: 'สบายใจเรื่องสุขภาพ' },
        ],
      },
      {
        id: 'drink_coffee_push',
        label: 'ซัดกาแฟเข้มๆ สองแก้วแล้วฝืนลุยต่อ',
        hint: 'ประหยัดเงินวันนี้ แต่พลังงานสำรองและสุขภาพอาจโดนเช็กบิลภายหลัง',
        effects: [
          { type: 'AddMoney', amount: -85, category: 'living', reason: 'ค่ากาแฟเย็นเอาตัวรอด' },
          { type: 'ChangeResource', resource: 'stress', delta: 7, reason: 'ฝืนสังขารทำงานต่อ' },
          {
            type: 'ScheduleEcho',
            delayDays: 10,
            title: 'ร่างกายทวงคืนค่ากาแฟ',
            description: 'อาการนอนไม่หลับและกรดไหลย้อนถามหาเต็มๆ หลังโหมร่างกายไม่ยอมพัก',
            effects: [
              { type: 'ChangeResource', resource: 'energy', delta: -18, reason: 'ร่างกายทรุดสะสม' },
              { type: 'ChangeRawStat', stat: 'endurance', delta: -2, reason: 'สุขภาพโทรมจากการฝืน' },
            ],
            sourceEventId: 'demo_health_check',
          },
        ],
      },
    ],
  },
];

export const AT_AGE_TURNING_POINTS: {
  minAge: number;
  maxAge: number;
  text: string;
  statDelta?: Partial<Record<RawStatKey, number>>;
  skillDelta?: Partial<Record<SkillKey, number>>;
  cashDelta?: number;
  debtDelta?: number;
}[] = [
  {
    minAge: 14,
    maxAge: 19,
    text: 'เคยแอบรับจ๊อบขายของออนไลน์ช่วงปิดเทอมจนพอรู้จังหวะหาเงินด้วยตัวเอง',
    skillDelta: { sales: 8, finance: 5 },
    cashDelta: 4500,
  },
  {
    minAge: 15,
    maxAge: 22,
    text: 'อกหักครั้งแรกอย่างรุนแรงตอนมัธยม/มหาลัย จนกลายเป็นคนอ่านอารมณ์คนเก่งขึ้น',
    statDelta: { eq: 6, charisma: 3 },
  },
  {
    minAge: 18,
    maxAge: 30,
    text: 'ต้องกู้ กยศ. หรือทำงานส่งตัวเองเรียน ทำให้รู้คุณค่าของเงินทุกบาททุกสตางค์',
    skillDelta: { finance: 10 },
    debtDelta: 65000,
  },
  {
    minAge: 20,
    maxAge: 38,
    text: 'เคยโดนเพื่อนร่วมงานแทงข้างหลังเรื่องผลงาน ทำให้ระแวดระวังตัวมากขึ้น',
    statDelta: { wit: 5, eq: 4 },
  },
  {
    minAge: 22,
    maxAge: 45,
    text: 'เคยลงขันเปิดร้านเล็กๆ กับเพื่อนแล้วเจ๊งไม่เป็นท่า เหลือไว้แต่ประสบการณ์และหนี้ก้อนเล็ก',
    skillDelta: { finance: 12, sales: 10 },
    debtDelta: 35000,
  },
  {
    minAge: 24,
    maxAge: 50,
    text: 'ฝึกภาษาอังกฤษและสกิลคอมพิวเตอร์ด้วยตัวเองตอนกลางคืนจนได้เปลี่ยนสายงาน',
    skillDelta: { english: 18, tech: 15 },
    statDelta: { endurance: 4 },
  },
  {
    minAge: 25,
    maxAge: 55,
    text: 'เคยแบกภาระค่าใช้จ่ายทางบ้านช่วงวิกฤตเศรษฐกิจ ทำให้ความน่าเชื่อถือสูงลิ่ว',
    statDelta: { reliability: 9, endurance: 5 },
  },
  {
    minAge: 28,
    maxAge: 60,
    text: 'รอดพ้นจากอุบัติเหตุใหญ่มาได้หวุดหวิด จึงหันมาใส่ใจสุขภาพและการเงินมากขึ้น',
    statDelta: { eq: 6, endurance: 4 },
    cashDelta: 12000,
  },
];
