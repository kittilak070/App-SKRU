import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;

const student = {
  name: 'นางสาว ธิดา คิดใหญ่',
  id: '674295066',
  status: 'ปกติ',
  level: 'ชั้นปีที่ 3',
  faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี',
  major: 'สาขาเทคโนโลยีสารสนเทศและนวัตกรรมดิจิทัล',
  totalCredits: 96,
  requiredCredits: 132,
  currentGpa: 3.68,
  lastTermGpa: 3.82
};

const terms = [
  {
    id: '1/66',
    term: 'ภาคเรียนที่ 1/2566',
    credits: '18 หน่วยกิต',
    subjects: '5 รายวิชา',
    gpa: '3.82',
    highlight: 'ล่าสุด',
    courses: [
      ['การเขียนโปรแกรมเบื้องต้น', 'A'],
      ['ระบบฐานข้อมูล', 'B+'],
      ['การออกแบบประสบการณ์ผู้ใช้', 'A'],
      ['ภาษาอังกฤษเพื่อการสื่อสาร', 'B+'],
      ['คณิตศาสตร์สำหรับคอมพิวเตอร์', 'A']
    ]
  },
  {
    id: '2/65',
    term: 'ภาคเรียนที่ 2/2565',
    credits: '19 หน่วยกิต',
    subjects: '5 รายวิชา',
    gpa: '3.65',
    courses: [
      ['โครงสร้างข้อมูลและอัลกอริทึม', 'B+'],
      ['การวิเคราะห์และออกแบบระบบ', 'A'],
      ['การจัดการโครงการซอฟต์แวร์', 'B+'],
      ['การสื่อสารในองค์กร', 'A'],
      ['สถิติสำหรับงานวิจัย', 'B']
    ]
  },
  {
    id: '1/65',
    term: 'ภาคเรียนที่ 1/2565',
    credits: '21 หน่วยกิต',
    subjects: '4 รายวิชา',
    gpa: '3.58',
    courses: [
      ['วิทยาการคอมพิวเตอร์เบื้องต้น', 'A'],
      ['ระบบปฏิบัติการ', 'B+'],
      ['การคิดเชิงคำนวณ', 'A'],
      ['ภาษาอังกฤษในชีวิตประจำวัน', 'B+']
    ]
  }
];

const advisorMessage = 'ขอแสดงความยินดีกับผลการเรียนที่ดีขึ้นในภาคเรียนล่าสุด ตั้งใจรักษามาตรฐานนี้ต่อไปนะคะ';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/student', (_req, res) => res.json(student));
app.get('/api/terms', (_req, res) => res.json(terms));
app.get('/api/advisor-message', (_req, res) => res.json({ message: advisorMessage }));

app.get('/api/report', (_req, res) => {
  const body = [
    'รายงานผลการศึกษา',
    `ชื่อ: ${student.name}`,
    `รหัสนักศึกษา: ${student.id}`,
    `GPAX สะสม: ${student.currentGpa.toFixed(2)}`,
    `หน่วยกิตสะสม: ${student.totalCredits}/${student.requiredCredits}`,
    '',
    ...terms.map((item) => `${item.term} | GPA ${item.gpa} | ${item.credits}`)
  ].join('\n');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="academic-report.txt"');
  res.send(body);
});

app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(port, () => {
  console.log(`SRU academic app running at http://localhost:${port}`);
});
