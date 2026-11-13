# เทียบแอป QEDify (v2) กับเล่ม "[2026] QEDify ver.NTS1"

เอกสารนี้ไล่ตามหัวข้อในเล่ม บอกว่าแอปตอนนี้ทำอะไรได้จริง และเล่มต้องแก้ตรงไหนให้ตรงกับของจริง
ตัวเลขทั้งหมดมาจากโค้ดใน branch `rewrite/v2` และผลของ `npm run verify`

## 1. ตัวเลขที่ใช้อ้างในเล่มได้

| รายการ | ค่า | ที่มา |
| --- | --- | --- |
| จำนวนบท | 4 | `lib/engine/catalog.ts` |
| จำนวนภารกิจ | 17 (รวมด่านบอส 1 ด่าน) | `lib/engine/missions-a.ts`, `missions-b.ts` |
| ทักษะที่ติดตาม mastery | 7 | momentum, vector, impulse, force–time, conservation, collision type, energy |
| รูปแบบ misconception ที่ตรวจจับได้ | 17 | `lib/engine/misconceptions.ts` |
| ระดับการช่วยเหลือ (support tier) | 3: Guided / Standard / Expert | `SUPPORT` ใน `catalog.ts` |
| ขั้นตอนที่จำลองผลของคำตอบผิดได้ | 23 ขั้นตอน ใน 15 ภารกิจ | `lib/engine/consequence.ts` |
| ภาษา | ไทยและอังกฤษ ทั้งแอป ภารกิจ และโค้ช AI | `lib/i18n.tsx` |
| ข้อคำถามแบบสอบถามความพึงพอใจ | นักเรียน 9 ข้อ, ครู 6 ข้อ (Likert 1–5) | `lib/survey.ts` |
| การตรวจความถูกต้องของโจทย์ | 20,400 ชุดโจทย์ ผ่านทั้งหมด | `npm run verify` |
| การตรวจผลจำลองของคำตอบผิด | 15,480 กรณี ผ่านทั้งหมด | `npm run verify` |
| การตรวจคำแปลภาษาไทย | 84,256 ข้อความ ไม่มีข้อความอังกฤษตกค้าง | `npm run verify` |

## 2. สิ่งที่เล่มเขียนไว้และแอปทำได้แล้ว

| ในเล่ม | ในแอป |
| --- | --- |
| L1: 4 หัวข้อย่อย (Momentum, Force & Impulse, Conservation, 1D Collisions) | 4 บท ตรงกันทุกหัวข้อ |
| L4 + ตาราง rubric: Application / Analysis / Decision-making, "within 2 attempts" | ทุกขั้นตอนของโจทย์ติดป้ายมิติการประเมิน หน้า Results แสดงผ่าน/ไม่ผ่านตามเกณฑ์ "ถูกภายใน 2 ครั้ง" |
| Example Assessment Problem (ยาน 2,000 kg, 10 m/s, หยุดใน 5 s) | ภารกิจ **Full Stop** (บท 2) คำตอบของตัวอย่างนี้คือ J = −20,000 N·s และ F = −4,000 N |
| Crash Test: เลือกวัสดุกันกระแทก | ภารกิจ **Crash Test**: เลือกวัสดุที่เบาที่สุดที่ทำให้ F = Δp/Δt ไม่เกินขีดจำกัด |
| M1.1 Momentum Transfer, M1.2 Impulse Control, M1.3 Interactive Vector (ejecting mass) | Tug Assist / The Junction, Crash Test / Orbital Rescue, Mass Ejection / Recoil |
| M2 Constraint-based: resource, safety threshold, time | แรงขับสูงสุดและเวลาเชื้อเพลิง (Orbital Rescue), ขีดจำกัดแรงของตัวยาน (Crash Test), นาฬิกาจับเวลาทุกภารกิจ |
| M3 Progression, Scaffolding, Fading (ZPD) | ปลดล็อกทีละด่าน; การ์ด scaffold, hint 3 ระดับ, เวกเตอร์ความเร็ว; เมื่อ mastery สูงขึ้น hint ลดจาก 3→2→1, เวกเตอร์และสูตรถูกซ่อน, เวลาสั้นลง |
| A3.2 "display hints … when stalled behavior is detected instead of giving the answer" | ถ้าไม่มีการใส่คำตอบนาน 40 / 60 / 90 วินาที (ตาม tier) แอปแสดงคำใบ้ระดับแนวคิดเอง โดยไม่บอกคำตอบ และบันทึกว่าขั้นนั้นเกิดอาการค้าง |
| M4.1 Behavioral logging: "the sequence of adjusting mass and velocity variables" | ห้องทดลองบันทึกลำดับตัวแปรที่ปรับก่อนรันแต่ละครั้ง (`lab[].path`) และทุกคำตอบในภารกิจบันทึกค่าที่ตอบ เวลา hint และ misconception |
| M4.2–M4.4 strategy analysis, efficiency, misconception detection | แยกแบบ "ตรงจากสูตร" กับ "ลองผิดลองถูก", เวลาตัดสินใจเฉลี่ย, อัตราใช้ hint, อัตราการค้าง, misconception 17 แบบ |
| A4.2 Logic Consistency | ตัวชี้วัด "ความสม่ำเสมอเชิงตรรกะ" ในหน้า Profile: สัดส่วนคำตอบในขั้นที่ใช้กฎการอนุรักษ์ซึ่งไม่ขัดกับกฎ |
| M5.1 Empirical response: "incorrect momentum calculations result in realistic consequences" | เมื่อตอบผิด กล่อง feedback เล่นฉากจำลองด้วยค่าที่ผู้เรียนตอบ เช่น ยานยังเคลื่อนที่ 12 m/s ตอนถึงสถานี หรือโมเมนตัมหลังชนมากกว่าก่อนชน โดยไม่เฉลยคำตอบ |
| M5.2 Learning from errors, M5.3 Positive reinforcement | feedback เจาะจง misconception พร้อมคำอธิบายสั้น, XP / ดาว / badge 9 แบบ / เลื่อนระดับ |
| A.1, A5, D1: drag-and-drop ของเวกเตอร์และตัวแปร | ภารกิจ: คำตอบที่เป็นปริมาณเวกเตอร์ (p, J, F, v) ตั้งค่าได้ด้วยการลากปลายลูกศร ทั้งขนาดและทิศ ห้องทดลอง: ลากลูกศรความเร็วของวัตถุในฉากได้โดยตรง และยังมี slider กับการพิมพ์ตัวเลข |
| A.3 "Multimodal visual and auditory elements" | เสียงประกอบ 7 แบบ (ตอบถูก ตอบผิด คำใบ้ ชน ชนะ แพ้ แตะ) สังเคราะห์ด้วย Web Audio ปิดได้ในหน้าตั้งค่า |
| A2.3 Pre-game Tutorial + Contextual Hook (จักรยาน vs รถบรรทุก) | Briefing ก่อนเข้าแต่ละบท บทที่ 1 เปิดด้วย hook จักรยานกับรถบรรทุก |
| A2.4 "Web Application that requires no installation and supports low-speed internet" | เว็บแอปที่ pre-render ทุกหน้า มี service worker เก็บไฟล์ทั้งหมดไว้ในเครื่องหลังเปิดครั้งแรก จึงเล่นต่อได้เมื่อเน็ตช้าหรือหลุด (ยกเว้นโค้ช AI) |
| A5 Virtual lab ปรับ m, v ได้อิสระ | หน้า Virtual Lab (ชนแบบ elastic / inelastic พร้อมตารางตรวจกฎอนุรักษ์) |
| A5 Creative problem solving: ไม่มีคำตอบเดียว | ขั้น "Plan the burn" ใน Orbital Rescue รับทุกคู่ (F, Δt) ที่ผลคูณถูกและไม่เกินขีดจำกัด |
| R (Retention) ใน LADDER | **Retention check**: ภารกิจที่ผ่านแล้วจะกลับมาให้ทำซ้ำหลัง 1, 3, 7, 14, 30 วัน ด้วยตัวเลขชุดใหม่ ไม่มี hint ไม่มี scaffold ไม่มีเวกเตอร์ ตัวชี้วัดคือความแม่นยำของคำตอบครั้งแรก |
| D3 Simulation Panel, Control Panel, Feedback Layer, Progression Dashboard | ฉากจำลอง, ช่องกรอก/ตัวเลือก/ตัวลากเวกเตอร์, กล่อง feedback, หน้า Profile |
| D5 เครื่องมือประเมิน: Likert-scale survey, behavioral engagement logs, completion rates | แบบสอบถามในแอป (นักเรียนและครู), ปุ่ม export ข้อมูลผู้เรียนเป็น JSON และ CSV, สคริปต์ `npm run aggregate` รวมไฟล์ของทุกคนเป็นตารางค่าเฉลี่ยและ SD |
| กลุ่มเป้าหมายนักเรียน ม.ปลายไทย | UI ภารกิจ บทเรียน และ feedback มีภาษาไทยครบ เบราว์เซอร์ที่ตั้งเป็นภาษาไทยจะเริ่มเป็นภาษาไทยเอง และสลับภาษาได้ที่หน้าแนะนำกับหน้าตั้งค่า |

## 3. จุดที่เล่มยังต้องแก้ให้ตรงกับแอป

### 3.1 เทคโนโลยี (หัวข้อ II.C)

| เล่มเขียนว่า | ความจริงในแอป | ข้อความที่เสนอให้ใช้แทน |
| --- | --- | --- |
| "artificial intelligence services such as the OpenAI API" | ใช้ Claude API ของ Anthropic ผ่าน serverless function | "…combined with a large language model service (Anthropic's Claude API), called from a serverless function so that no API key reaches the client." |
| "Cloud-based infrastructures, including Supabase" | ยังไม่มี cloud database ข้อมูลผู้เรียนเก็บในเครื่อง และส่งออกเป็นไฟล์ได้ | "Learner data are stored locally on the device and can be exported for analysis, which keeps the platform usable on low-speed connections; a cloud back end is planned for cross-device sync and class-level analytics." |
| "Reanimated and the Canvas API" | ใช้ Reanimated, Gesture Handler และกราฟิก SVG ไม่ได้ใช้ Canvas API | "Reanimated, React Native Gesture Handler and SVG vector graphics" |
| "within a single-page architecture" | แต่ละหน้า pre-render เป็น HTML แยก | "statically pre-rendered pages that hydrate into an interactive app" |

### 3.2 บทบาทของ AI (Abstract, L5, D4.3, Conclusions)

เล่มเขียนว่า AI สร้างโจทย์และปรับความยาก แต่ในแอปแบ่งงานดังนี้ ซึ่งป้องกันโจทย์ผิดได้ดีกว่า:

- **ตัวสร้างโจทย์แบบพาราเมตริก** (ไม่ใช่ AI) สุ่มตัวเลขจาก seed และคำนวณคำตอบเอง ทุกโจทย์ถูกตรวจกับกฎอนุรักษ์
- **แบบจำลองผู้เรียน** (ไม่ใช่ AI) คำนวณ mastery รายทักษะแบบ exponential moving average แล้วกำหนด support tier
- **Claude** เขียน hint เฉพาะบุคคล, สรุปหลังภารกิจ, และ learning insights จากข้อมูลที่ระบบวิเคราะห์ไว้แล้ว

ข้อความที่เสนอ:

- L5: เปลี่ยน "QEDify employs AI to dynamically generate varied problem conditions and adjust difficulty levels" เป็น "QEDify uses a seeded parametric generator to produce varied problem conditions, and a mastery-based learner model to adjust the level of support. An LLM coach (Claude) then turns the detected misconception and the learner's attempt history into personalised hints and debriefs."
- D4.3: เปลี่ยน "AI-driven mechanisms adjust difficulty" เป็น "A learner model adjusts difficulty and scaffolding; the AI coach provides hints based on learner performance."
- ทุกที่ที่เขียน "AI-driven analytics … dynamic difficulty adjustment" ให้แยกเป็น "learning analytics and adaptive difficulty" กับ "AI-generated coaching"

โค้ช AI ยังไม่เคยทดสอบกับ API key จริงบนเครื่องพัฒนา ต้องทดสอบก่อนส่งเล่ม เพราะชื่อเล่มขึ้นต้นว่า "AI-Powered"

### 3.3 ข้ออ้างที่แอปยังไม่ทำ

| เล่มเขียนว่า | ความจริง | ทางแก้ |
| --- | --- | --- |
| "unlocking new equipment" (M5.3) | ไม่มีอุปกรณ์ มีแต่ภารกิจใหม่, badge และระดับ | เปลี่ยนเป็น "unlocking new missions or earning mastery badges" |
| "peer recognition", "collaborative learning communities", "collaborative strategy sharing", "peer interaction and collaborative meaning-making" | Leaderboard เป็น "ทีมฝึก" ที่มีนักเรียนจำลอง 9 คน บวกผู้เล่นจริง 1 คน และในแอปเขียนกำกับไว้ชัดเจน | เขียนว่าเป็นต้นแบบ ("a leaderboard prototype with simulated peers; live class rankings require the planned cloud back end") หรือเชื่อม backend ให้เสร็จก่อนส่งเล่ม |
| มุมมองครู: "Assessment Capability: effectiveness of analytics and performance tracking" | ครูดูข้อมูลได้จากไฟล์ที่นักเรียน export มาให้ ยังไม่มีหน้ารวมของทั้งห้อง | ระบุว่าใช้ไฟล์ export และสคริปต์รวมผล หรือทำ dashboard ครูเมื่อมี backend |

### 3.4 ผลการประเมิน (D5, Abstract)

- เครื่องมือเก็บข้อมูลพร้อมแล้ว แต่ **ยังไม่มีข้อมูลจริง** D5 จึงยังเป็นกรอบการประเมิน
- Abstract เขียนว่า "Results demonstrate the potential of QEDify…" ซึ่งต้องมีผลรองรับ ถ้ายังไม่ได้เก็บข้อมูล ให้เปลี่ยนเป็น "This paper presents the design and implementation…" และย้ายการประเมินไปไว้ใน Future work
- วิธีเก็บข้อมูลเมื่อพร้อม:
  1. ให้นักเรียนเล่น แล้วตอบแบบสอบถามในแอป (การ์ดแบบสอบถามขึ้นในหน้าหลักเมื่อผ่าน 4 ภารกิจ หรือเปิดจากหน้าตั้งค่า) ครูเลือกบทบาท "ครู" ในแบบสอบถามเดียวกัน
  2. แต่ละคนกด ตั้งค่า → ส่งออกข้อมูลการเรียนรู้ → ข้อมูลทั้งหมด (JSON) แล้วส่งไฟล์ให้ผู้วิจัย ค่าเริ่มต้นไม่มีชื่อและโรงเรียนในไฟล์
  3. รวมไฟล์ไว้ในโฟลเดอร์เดียว แล้วรัน `npm run aggregate -- <โฟลเดอร์>` จะได้ `participants.csv`, `likert.csv` (n, mean, SD, % เห็นด้วย รายข้อ) และ `misconceptions.csv`
- สิ่งที่รายงานเป็นผลเชิงเทคนิคได้ทันที: ตัวเลขในหัวข้อ 1 และผลวัดประสิทธิภาพของหน้าเว็บ

### 3.5 ส่วนของ LADDER ที่เล่มยังไม่มีหัวข้อ

เล่มนิยาม L, A, D, D, E, R แต่ผลลัพธ์ครอบคลุมถึง D ตัวที่สอง ควรเพิ่มสองหัวข้อ:

- **E (Engagement and Aesthetics)**: ธีมอวกาศ, กราฟิก SVG ที่วาดเอง, เสียงประกอบ, XP / ดาว / badge / streak, ภารกิจประจำวัน และผลแบบสอบถามด้าน Engagement
- **R (Retention)**: กลไก retention check ตามช่วงเวลา (1, 3, 7, 14, 30 วัน) และตัวชี้วัดความแม่นยำของคำตอบครั้งแรกโดยไม่มีตัวช่วย

### 3.6 ข้อความเทมเพลตและข้อผิดพลาดที่ต้องลบ

- ชื่อผู้เขียนทั้ง 4 ช่องยังเป็น "Given Name Surname" และช่องที่ 4 ถูกตัดเป็น "ORCI"
- บรรทัดบนสุด "XXX-X-XXXX-XXXX-X/XX/$XX.00 ©20XX IEEE" และ "*Note: Sub-titles are not captured in Xplore…"
- "Identify applicable funding agency here. If none, delete this text box." (ท้ายหน้า 2 และ 3)
- ใต้หัวข้อ C. Design of Game Mechanics มีย่อหน้าเทมเพลต "The equations are an exception to the prescribed specifications…"
- ACKNOWLEDGMENT ทั้งย่อหน้าเป็นข้อความเทมเพลต
- REFERENCES [1]–[11] เป็นตัวอย่างของเทมเพลตทั้งหมด ต้องแทนด้วยงานที่อ้างจริง (Maslow, MDA framework, Bloom's taxonomy, Cognitive Load Theory, Flow, ZPD, LADDER model) และใส่เลขอ้างอิงในเนื้อหา
- ย่อหน้าท้ายสุด "IEEE conference templates contain guidance text…"
- หน้า 4 มีคำภาษาฮีบรู "םאתהב" ในประโยค "adjust difficulty levels םאתהב to learner performance" ควรเป็น "according"
- หัวข้อ "D. The Development of Dynamic Behavor in DEG." สะกดผิด ควรเป็น "Behavior"
- Figure 1 และ Figure 2 ไม่มีคำบรรยาย และควรเปลี่ยนเป็นภาพหน้าจอของแอปเวอร์ชันใหม่ เช่น หน้าภารกิจพร้อมตัวลากเวกเตอร์ และกล่อง feedback ที่เล่นผลของคำตอบผิด
- ลิงก์ `https://qedify.vercel.app/` จะแสดงเวอร์ชันใหม่ก็ต่อเมื่อ deploy branch นี้แล้ว

## 4. รายชื่อภารกิจ (ใช้ทำตารางในเล่มได้)

| บท | ภารกิจ | แนวคิด | มิติการประเมิน | จำลองผลคำตอบผิด |
| --- | --- | --- | --- | --- |
| 1 | Cargo Check | p = mv | Application | มี |
| 1 | Heavy or Fast? | เปรียบเทียบโมเมนตัม | Analysis, Application | มี (ขั้นเลือกยาน) |
| 1 | Opposite Lanes | โมเมนตัมเป็นเวกเตอร์ | Application | ไม่มี (เป็นการอ่านค่า) |
| 1 | Tug Assist | หา v หรือ m จาก p | Application | มี |
| 2 | Orbital Rescue | J = Δp, เลือก F และ Δt ภายใต้ข้อจำกัด | Application | มี (ทั้งสองขั้น) |
| 2 | Full Stop | อิมพัลส์และแรงเพื่อหยุดยาน | Application | มี (ทั้งสองขั้น) |
| 2 | Crash Test | เวลาชนกับแรงกระแทก | Analysis, Application | มี (ขั้นเลือกวัสดุ) |
| 2 | Burn Window | อิมพัลส์เปลี่ยนความเร็ว | Application | มี (ขั้นความเร็วใหม่) |
| 3 | The Junction | ชนแล้วติดกัน | Application | มี |
| 3 | Recoil | แรงถีบกลับจากสภาพนิ่ง | Analysis, Application | มี (ขั้นความเร็ว) |
| 3 | Head-On Docking | อนุรักษ์โมเมนตัมแบบมีทิศทาง | Application | มี |
| 3 | Mass Ejection | พ่นมวลเพื่อเคลื่อนที่ | Decision, Application | มี (ทั้งสองขั้น) |
| 4 | Bounce or Stick? | จำแนกการชนด้วยพลังงานจลน์ | Application, Decision | ไม่มี (เป็นการอ่านค่าและจำแนก) |
| 4 | Elastic Transfer | การชนแบบยืดหยุ่น | Application | มี (ทั้งสองขั้น) |
| 4 | Energy Audit | พลังงานจลน์ที่หายไป | Application, Analysis | มี (ขั้นความเร็วร่วม) |
| 4 | Clamp or Bumper? | เลือกชนิดการชนตามเป้าหมาย | Decision, Application | มี (ทั้งสองขั้น) |
| 4 | Crisis Protocol (BOSS) | อิมพัลส์ + อนุรักษ์ + พลังงาน ต่อเนื่อง 4 ขั้น | Application, Analysis | มี (3 จาก 4 ขั้น) |
