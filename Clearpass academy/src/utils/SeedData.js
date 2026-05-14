export const lessonData = {
  'infection-control': [
    {
      id: 1,
      title: 'Introduction to SNF Infection Control',
      content: `
        <p>Infection prevention and control (IPC) is a critical component of providing safe, high-quality care in skilled nursing facilities (SNFs). Residents in SNFs are particularly vulnerable to infections due to age-related changes in the immune system, underlying chronic conditions, and the congregate nature of the setting.</p>
        <div class="bg-blue-50 p-4 border-l-4 border-blue-500 my-4">
          <p class="font-bold text-blue-800 text-xs uppercase tracking-widest">F-Tag Reference: F880</p>
          <p class="text-blue-900 mt-1 text-sm">Facilities must establish and maintain an infection prevention and control program designed to provide a safe, sanitary and comfortable environment and to help prevent the development and transmission of communicable diseases and infections.</p>
        </div>
        <h3 class="text-xl font-bold mt-6 mb-3">Key Objectives</h3>
        <ul class="list-disc ml-6 space-y-2">
          <li>Systematically collect and analyze data on infections.</li>
          <li>Implement evidence-based practices to prevent transmission.</li>
          <li>Ensure staff competency through regular training and audit.</li>
        </ul>
      `
    },
    {
      id: 2,
      title: 'Standard Precautions & Hand Hygiene',
      content: `
        <p>Standard precautions are the minimum infection prevention practices that apply to all resident care, regardless of suspected or confirmed infection status of the resident, in any setting where healthcare is delivered.</p>
        <h3 class="text-xl font-bold mt-6 mb-3">Hand Hygiene: The 5 Moments</h3>
        <p>According to the WHO, staff should perform hand hygiene at these critical points:</p>
        <ol class="list-decimal ml-6 space-y-2 mt-2">
          <li>Before touching a resident.</li>
          <li>Before clean/aseptic procedures.</li>
          <li>After body fluid exposure risk.</li>
          <li>After touching a resident.</li>
          <li>After touching resident surroundings.</li>
        </ol>
      `
    }
  ]
}

export const quizData = {
  'infection-control': [
    {
      question: "Which F-tag specifically addresses the facility's overall Infection Prevention and Control Program?",
      options: ["F600", "F880", "F686", "F761"],
      answer: 1, // F880
      explanation: "F880 is the primary federal tag for Infection Control. F600 relates to abuse, while F686 is for pressure sores."
    },
    {
      question: "True or False: Standard precautions only apply to residents with a known infection.",
      options: ["True", "False"],
      answer: 1, // False
      explanation: "Standard precautions are based on the principle that all blood, body fluids, secretions, and excretions (except sweat) may contain transmissible infectious agents."
    },
    {
      question: "Which of the following is NOT one of the WHO's '5 Moments' for hand hygiene?",
      options: [
        "Before touching a resident",
        "After body fluid exposure risk",
        "Before entering the facility breakroom",
        "After touching resident surroundings"
      ],
      answer: 2, // Before entering the breakroom
      explanation: "The 5 moments are specifically clinical touchpoints. While hand hygiene is good practice before breaks, it is not one of the official WHO 5 Moments for clinical safety."
    }
  ]
}

export const catalogCourses = [
  { id: 'cp-rr', title: 'Resident Rights & Dignity', regulatory: '42 CFR §483.10', hours: 1.0, plan: 'essentials', icon: '⚖️' },
  { id: 'cp-abuse', title: 'Abuse, Neglect & Prevention', regulatory: '42 CFR §483.12', hours: 1.0, plan: 'essentials', icon: '🛡️' },
  { id: 'cp-qoc', title: 'Quality of Care Standards', regulatory: '42 CFR §483.25', hours: 1.5, plan: 'essentials', icon: '🏥' },
  { id: 'cp-ic', title: 'Infection Prevention & Control', regulatory: '42 CFR §483.80', hours: 1.0, plan: 'essentials', icon: '🦠' },
  { id: 'cp-adrd', title: 'Alzheimer\'s & Dementia', regulatory: '42 CFR §483.40', hours: 2.0, plan: 'command', icon: '🧠' }
]
