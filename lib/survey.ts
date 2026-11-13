import type { Bi } from "./engine/lang";
import type { SurveyRole } from "./progress";

/**
 * User-satisfaction questionnaire (paper D5). Students rate engagement,
 * usability and perceived learning; teachers rate curriculum alignment,
 * assessment capability and adoptability. Every item is a 1–5 Likert scale.
 */
export interface SurveyItem {
  id: string;
  group: Bi;
  text: Bi;
}

const ENGAGEMENT: Bi = ["Engagement", "ความมีส่วนร่วม"];
const USABILITY: Bi = ["Usability", "ความง่ายในการใช้งาน"];
const LEARNING: Bi = ["Perceived learning", "การเรียนรู้ที่รับรู้ได้"];
const CURRICULUM: Bi = ["Curriculum alignment", "ความสอดคล้องกับหลักสูตร"];
const ASSESSMENT: Bi = ["Assessment capability", "ความสามารถในการประเมิน"];
const ADOPTION: Bi = ["Adoptability", "การนำไปใช้ในชั้นเรียน"];

export const SURVEY: Record<SurveyRole, SurveyItem[]> = {
  student: [
    { id: "E1", group: ENGAGEMENT, text: ["I wanted to keep playing to clear the next mission.", "ฉันอยากเล่นต่อเพื่อผ่านภารกิจถัดไป"] },
    { id: "E2", group: ENGAGEMENT, text: ["The space-rescue story made the physics more interesting.", "เรื่องราวกู้ภัยอวกาศทำให้ฟิสิกส์น่าสนใจขึ้น"] },
    { id: "E3", group: ENGAGEMENT, text: ["I stayed focused while I was solving a mission.", "ฉันมีสมาธิจดจ่อระหว่างแก้โจทย์ในภารกิจ"] },
    { id: "U1", group: USABILITY, text: ["It was easy to see what to do on each screen.", "แต่ละหน้าจอเข้าใจได้ง่ายว่าต้องทำอะไร"] },
    { id: "U2", group: USABILITY, text: ["Entering answers and dragging vectors was easy.", "การใส่คำตอบและการลากเวกเตอร์ทำได้ง่าย"] },
    { id: "U3", group: USABILITY, text: ["The feedback after a wrong answer was clear.", "คำแนะนำหลังตอบผิดเข้าใจได้ชัดเจน"] },
    { id: "L1", group: LEARNING, text: ["I understand momentum and impulse better after playing.", "หลังเล่น ฉันเข้าใจโมเมนตัมและการดลมากขึ้น"] },
    { id: "L2", group: LEARNING, text: ["The simulations helped me see what the formulas mean.", "การจำลองช่วยให้ฉันเห็นว่าสูตรหมายถึงอะไร"] },
    { id: "L3", group: LEARNING, text: ["I could solve similar problems in class on my own.", "ฉันแก้โจทย์แบบเดียวกันในห้องเรียนได้ด้วยตัวเอง"] },
  ],
  teacher: [
    { id: "C1", group: CURRICULUM, text: ["The missions match the learning objectives for momentum and collisions.", "ภารกิจสอดคล้องกับจุดประสงค์การเรียนรู้เรื่องโมเมนตัมและการชน"] },
    { id: "C2", group: CURRICULUM, text: ["The difficulty progression suits upper-secondary students.", "ลำดับความยากเหมาะกับนักเรียนมัธยมศึกษาตอนปลาย"] },
    { id: "A1", group: ASSESSMENT, text: ["The analytics show what each student can and cannot do.", "ข้อมูลวิเคราะห์แสดงให้เห็นว่านักเรียนแต่ละคนทำอะไรได้และยังทำไม่ได้"] },
    { id: "A2", group: ASSESSMENT, text: ["The misconception reports would help me plan my teaching.", "รายงานความเข้าใจคลาดเคลื่อนช่วยให้ฉันวางแผนการสอนได้"] },
    { id: "D1", group: ADOPTION, text: ["I could use QEDify in my lessons without extra preparation.", "ฉันนำ QEDify ไปใช้ในคาบเรียนได้โดยไม่ต้องเตรียมการเพิ่ม"] },
    { id: "D2", group: ADOPTION, text: ["It would work with the devices and internet my students have.", "ใช้ได้กับอุปกรณ์และอินเทอร์เน็ตที่นักเรียนของฉันมี"] },
  ],
};

export const LIKERT: Bi[] = [
  ["Strongly disagree", "ไม่เห็นด้วยอย่างยิ่ง"],
  ["Disagree", "ไม่เห็นด้วย"],
  ["Neutral", "เฉย ๆ"],
  ["Agree", "เห็นด้วย"],
  ["Strongly agree", "เห็นด้วยอย่างยิ่ง"],
];
