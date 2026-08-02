const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../src/models/User');
const Note = require('../src/modules/sticky-notes/model');

const NOTE_COLORS = [
  '#FDE047', // Yellow
  '#7DD3FC', // Sky
  '#6EE7B7', // Emerald
  '#FDA4AF', // Rose/Red
  '#FDBA74', // Orange
  '#D8B4FE', // Purple
];

const seedData = [
  {
    title: 'Project Launch Plan',
    content: `1. **Finalize Designs**: Complete the brutalist redesign by Thursday.\n2. **Backend Optimization**: Refactor MongoDB indexing for better search performance.\n3. **Deploy to Vercel**: Set up CI/CD pipeline.\n4. **Marketing Blast**: Prepare the email sequence.\n\n*Note: Don't forget to double-check the mobile view!*`,
    bgColor: NOTE_COLORS[0],
    isPinned: true
  },
  {
    title: 'Grocery & Errands',
    content: `- Almond milk\n- Eggs\n- Whole wheat bread\n- Avocados\n- Pick up dry cleaning\n- Call the plumber about the sink leak.`,
    bgColor: NOTE_COLORS[1],
    isPinned: false
  },
  {
    title: 'Meeting Notes: Q3 Strategy',
    content: `**Attendees**: Alice, Bob, Charlie.\n\n**Key Takeaways**:\n- Revenue is up 15% YoY.\n- Need to focus on user retention in Q4.\n- The new GSAP animations are a huge hit with the alpha testers.\n\n**Action Items**:\n- [ ] Charlie to draft Q4 roadmap.\n- [ ] Alice to review server costs.`,
    bgColor: NOTE_COLORS[2],
    isPinned: true
  },
  {
    title: 'Favorite Quotes',
    content: `"Simplicity is the ultimate sophistication." - Leonardo da Vinci\n\n"Any fool can write code that a computer can understand. Good programmers write code that humans can understand." - Martin Fowler\n\n"The only way to do great work is to love what you do." - Steve Jobs`,
    bgColor: NOTE_COLORS[3],
    isPinned: false
  },
  {
    title: 'Workout Routine',
    content: `**Monday**: Chest & Triceps (Bench 4x8, Dips 3x12, Pushdowns 3x15)\n**Wednesday**: Back & Biceps (Pullups 4xMax, Rows 4x10, Curls 3x12)\n**Friday**: Legs & Shoulders (Squats 4x8, OHP 4x8, Leg Extensions 3x15)\n\n*Remember to stretch for 10 mins before each session!*`,
    bgColor: NOTE_COLORS[4],
    isPinned: false
  },
  {
    title: 'Code Snippet: API Fetch',
    content: `\`\`\`javascript\nexport const apiFetch = async (endpoint, options = {}) => {\n  const token = getCookie('auth_token');\n  const headers = new Headers(options.headers);\n  if (token) headers.set('Authorization', \`Bearer \${token}\`);\n  \n  const res = await fetch(\`/api\${endpoint}\`, { ...options, headers });\n  return res.json();\n};\n\`\`\`\nThis is a handy wrapper for our Next.js frontend to securely call the Express backend.`,
    bgColor: NOTE_COLORS[5],
    isPinned: true
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mini_projects');
    console.log('Connected to DB');

    const email = 'tanmaytk03@gmail.com';
    const user = await User.findOne({ email });

    if (!user) {
      console.error(`User with email ${email} not found. Please register first.`);
      process.exit(1);
    }

    console.log(`Found user: ${user.name}`);

    // Insert the 6 notes
    for (let i = 0; i < seedData.length; i++) {
      const data = seedData[i];
      const newNote = new Note({
        userId: user._id,
        title: data.title,
        content: data.content,
        bgColor: data.bgColor,
        textColor: '#000000',
        isPinned: data.isPinned,
        position: i * 1000
      });
      await newNote.save();
    }

    console.log('Successfully inserted 6 complex notes!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
