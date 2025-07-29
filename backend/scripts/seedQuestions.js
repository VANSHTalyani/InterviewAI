const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Question = require('../models/Question');

dotenv.config();

const questions = [
  // Technical Questions
  {
    text: "What is the difference between let, const, and var in JavaScript?",
    type: "technical",
    category: "JavaScript",
    difficulty: "easy",
    tags: ["javascript", "variables", "es6"],
    sampleAnswer: "var has function scope and can be redeclared, let has block scope and cannot be redeclared, const has block scope and cannot be reassigned or redeclared.",
    hints: ["Think about scope differences", "Consider hoisting behavior"],
    isPublic: true
  },
  {
    text: "Explain the concept of closures in JavaScript with an example.",
    type: "technical",
    category: "JavaScript",
    difficulty: "medium",
    tags: ["javascript", "closures", "scope"],
    sampleAnswer: "A closure is created when a function retains access to variables from its outer scope even after the outer function has returned.",
    hints: ["Consider inner functions accessing outer variables", "Think about variable persistence"],
    isPublic: true
  },
  {
    text: "What is the time complexity of binary search?",
    type: "technical",
    category: "Algorithms",
    difficulty: "easy",
    tags: ["algorithms", "binary-search", "time-complexity"],
    sampleAnswer: "O(log n) because we eliminate half the search space in each iteration.",
    hints: ["Think about how the search space changes", "Consider the number of iterations needed"],
    isPublic: true
  },
  {
    text: "Implement a function to reverse a linked list.",
    type: "technical",
    category: "Data Structures",
    difficulty: "medium",
    tags: ["data-structures", "linked-list", "algorithms"],
    codeSnippet: `function reverseLinkedList(head) {
    let prev = null;
    let current = head;
    let next = null;
    
    while (current !== null) {
        next = current.next;
        current.next = prev;
        prev = current;
        current = next;
    }
    
    return prev;
}`,
    sampleAnswer: "We can reverse a linked list by iterating through it and reversing the next pointers.",
    hints: ["Use three pointers: prev, current, next", "Update pointers in the correct order"],
    isPublic: true
  },
  {
    text: "What is React's virtual DOM and why is it beneficial?",
    type: "technical",
    category: "React",
    difficulty: "medium",
    tags: ["react", "virtual-dom", "performance"],
    sampleAnswer: "Virtual DOM is a JavaScript representation of the actual DOM. It's beneficial because it allows React to optimize updates by batching changes and only updating what's necessary.",
    hints: ["Think about performance optimizations", "Consider DOM manipulation costs"],
    isPublic: true
  },
  {
    text: "Explain the difference between SQL and NoSQL databases.",
    type: "technical",
    category: "Databases",
    difficulty: "easy",
    tags: ["databases", "sql", "nosql"],
    sampleAnswer: "SQL databases are relational with structured schemas, while NoSQL databases are non-relational and can handle unstructured data with flexible schemas.",
    hints: ["Consider structure vs flexibility", "Think about ACID properties"],
    isPublic: true
  },
  {
    text: "What are database indexes and how do they improve performance?",
    type: "technical",
    category: "Databases",
    difficulty: "medium",
    tags: ["databases", "indexes", "performance"],
    sampleAnswer: "Database indexes are data structures that improve query performance by creating shortcuts to data, similar to an index in a book.",
    hints: ["Think about search efficiency", "Consider trade-offs with write performance"],
    isPublic: true
  },
  {
    text: "Explain the concept of RESTful APIs and HTTP methods.",
    type: "technical",
    category: "APIs",
    difficulty: "medium",
    tags: ["rest", "api", "http"],
    sampleAnswer: "REST is an architectural style for web services using HTTP methods (GET, POST, PUT, DELETE) to perform operations on resources identified by URLs.",
    hints: ["Think about resource-based URLs", "Consider stateless communication"],
    isPublic: true
  },

  // Behavioral Questions
  {
    text: "Tell me about a time when you had to work with a difficult team member.",
    type: "behavioral",
    category: "Teamwork",
    difficulty: "medium",
    tags: ["teamwork", "conflict-resolution", "communication"],
    sampleAnswer: "Use the STAR method: Situation, Task, Action, Result. Focus on how you handled the situation professionally and what you learned.",
    hints: ["Use specific examples", "Focus on your actions and growth", "Show emotional intelligence"],
    isPublic: true
  },
  {
    text: "Describe a project you're particularly proud of.",
    type: "behavioral",
    category: "Achievements",
    difficulty: "easy",
    tags: ["achievements", "projects", "pride"],
    sampleAnswer: "Choose a project that showcases your skills and impact. Explain the challenges, your role, and the positive outcomes.",
    hints: ["Quantify your impact", "Explain your specific contributions", "Show passion and ownership"],
    isPublic: true
  },
  {
    text: "How do you handle tight deadlines and pressure?",
    type: "behavioral",
    category: "Stress Management",
    difficulty: "medium",
    tags: ["pressure", "deadlines", "time-management"],
    sampleAnswer: "Discuss your prioritization strategies, communication with stakeholders, and specific techniques you use to maintain quality under pressure.",
    hints: ["Give specific strategies", "Show you can prioritize effectively", "Mention communication skills"],
    isPublic: true
  },
  {
    text: "Tell me about a time when you made a mistake. How did you handle it?",
    type: "behavioral",
    category: "Problem Solving",
    difficulty: "medium",
    tags: ["mistakes", "accountability", "learning"],
    sampleAnswer: "Be honest about the mistake, explain how you took responsibility, fixed it, and what you learned to prevent similar issues.",
    hints: ["Show accountability", "Focus on lessons learned", "Demonstrate problem-solving skills"],
    isPublic: true
  },
  {
    text: "Describe a situation where you had to learn something new quickly.",
    type: "behavioral",
    category: "Learning",
    difficulty: "easy",
    tags: ["learning", "adaptability", "growth"],
    sampleAnswer: "Share a specific example showing your learning process, resources used, and how you successfully applied the new knowledge.",
    hints: ["Show your learning methodology", "Demonstrate adaptability", "Explain the outcome"],
    isPublic: true
  },
  {
    text: "How do you prioritize your work when you have multiple competing deadlines?",
    type: "behavioral",
    category: "Time Management",
    difficulty: "medium",
    tags: ["prioritization", "time-management", "organization"],
    sampleAnswer: "Explain your prioritization framework, how you communicate with stakeholders, and tools or methods you use to stay organized.",
    hints: ["Mention specific frameworks (e.g., Eisenhower matrix)", "Show communication skills", "Give concrete examples"],
    isPublic: true
  },
  {
    text: "Tell me about a time when you had to give constructive feedback to a colleague.",
    type: "behavioral",
    category: "Leadership",
    difficulty: "hard",
    tags: ["feedback", "leadership", "communication"],
    sampleAnswer: "Focus on how you approached the conversation diplomatically, the specific feedback given, and the positive outcome that resulted.",
    hints: ["Show empathy and tact", "Focus on behavior, not personality", "Explain the positive impact"],
    isPublic: true
  },
  {
    text: "Describe a time when you disagreed with your manager's decision.",
    type: "behavioral",
    category: "Communication",
    difficulty: "hard",
    tags: ["disagreement", "communication", "professionalism"],
    sampleAnswer: "Show how you respectfully voiced your concerns, presented alternatives, and ultimately supported the final decision professionally.",
    hints: ["Show respect for hierarchy", "Focus on data and reasoning", "Demonstrate professionalism"],
    isPublic: true
  }
];

const seedQuestions = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected...');

    // Clear existing questions
    await Question.deleteMany({});
    console.log('Existing questions deleted...');

    // Insert new questions
    await Question.insertMany(questions);
    console.log('Questions seeded successfully...');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

if (require.main === module) {
  seedQuestions();
}

module.exports = seedQuestions;
