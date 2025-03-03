export const creativeWords = [
  'creative', 'innovative', 'curious', 'fascinating', 'exploring', 'unique', 
  'discover', 'imagination', 'inspiring', 'breakthrough', 'dynamic', 'energy',
  'passionate', 'intriguing', 'revolutionary', 'spontaneous', 'challenging', 'original',
  'daring', 'exciting', 'adventurous'
];

export const conservativeWords = [
  'careful', 'structured', 'appropriate', 'established', 'systematic', 'stable',
  'traditional', 'orderly', 'cautious', 'secure', 'regulated', 'measured',
  'proper', 'consistent', 'standard', 'reasonable', 'conventional', 'prudent', 
  'methodical', 'compliance', 'ethical'
];

export const stances = {
  freedom: 'preserving freedom of speech on social media platforms',
  safety: 'protecting the safety of users on social media platforms'
};

export const botPersonalities = {
  creative: 'innovative and curious, fostering creative thinking',
  conservative: 'traditional and structured, fostering systematic thinking'
};

export const aiModels = {
  gpt: 'gpt-4',
  gemini: 'gemini-pro'
};

export const experimentalConditions = {
  conditions: [
    { aiModel: 'gpt', stance: 'freedom', personality: 'creative' },
    { aiModel: 'gpt', stance: 'freedom', personality: 'conservative' },
    { aiModel: 'gpt', stance: 'safety', personality: 'creative' },
    { aiModel: 'gpt', stance: 'safety', personality: 'conservative' },
    { aiModel: 'gemini', stance: 'freedom', personality: 'creative' },
    { aiModel: 'gemini', stance: 'freedom', personality: 'conservative' },
    { aiModel: 'gemini', stance: 'safety', personality: 'creative' },
    { aiModel: 'gemini', stance: 'safety', personality: 'conservative' }
  ]
};

export const fewshotExamples = {
  freedomOfSpeech: {
    creative: [
      {
        bot: "Let's explore your fascinating thoughts about freedom of speech on social media! What unique example comes to mind that shows why this freedom is important in our dynamic digital world?",
        user: "Well, I've seen people sharing important information during crisis situations.",
        bot: "That's an inspiring perspective! I'm curious to discover more - what innovative benefits do you think emerge when people have this freedom during such challenging times?"
      }
    ],
    conservative: [
      {
        bot: "Let's examine your structured thoughts about freedom of speech on social media. What established example comes to mind that shows why this freedom is important in our regulated digital world?",
        user: "Well, I've seen people sharing important information during crisis situations.",
        bot: "That's a measured perspective. I'm interested to analyze further - what proper benefits do you think emerge when people have this freedom during such situations?"
      }
    ]
  },
  userSafety: {
    creative: [
      {
        bot: "Let's explore your fascinating thoughts about protecting user safety on social media! What unique example comes to mind that shows why this protection is important in our dynamic digital world?",
        user: "Well, I've seen cases where people were harmed by online harassment.",
        bot: "That's an inspiring perspective! I'm curious to discover more - what innovative benefits do you think emerge when we prioritize user protection in such challenging situations?"
      }
    ],
    conservative: [
      {
        bot: "Let's examine your structured thoughts about protecting user safety on social media. What established example comes to mind that shows why this protection is important in our regulated digital world?",
        user: "Well, I've seen cases where people were harmed by online harassment.",
        bot: "That's a measured perspective. I'm interested to analyze further - what proper benefits do you think emerge when we prioritize user protection in such situations?"
      }
    ]
  }
};

const createBasePrompt = (currentStance, oppositeStance) => {
  return `You are a facilitating AI assistant. Help the user explore why ${currentStance} is important and might be more crucial than ${oppositeStance}. Ask engaging questions to guide their thinking and encourage specific examples. Provide positive feedback when users show good understanding (e.g., "Excellent! You really understand ${currentStance}!"). Keep responses concise (2-3 sentences) and always stay focused on topic.`;
};

const createPersonalityPrompt = (currentStance, personality, wordList) => {
  return personality === 'creative'
    ? `Be innovative and curious, fostering creative thinking about why ${currentStance} is important. These words represent your personality style: ${wordList.join(', ')}. Use these words and others which convey similar ideas in EVERY response.`
    : `Be traditional and structured, fostering systematic thinking about why ${currentStance} is important. These words represent your personality style: ${wordList.join(', ')}. Use these words and others which convey similar ideas in EVERY response.`;
};

export const getSystemPrompt = (stance, personality, model = 'gemini') => {
  console.log('getSystemPrompt input:', { stance, personality, model });
  
  // Convert full stance text back to key
  const stanceKey = Object.keys(stances).find(key => stances[key] === stance);
  console.log('Found stance key:', stanceKey);
  
  // Make sure we have valid stance
  if (!stanceKey || !stances[stanceKey]) {
    console.error('Invalid stance provided:', stance);
    console.log('Available stances:', stances);
    return null;
  }

  const currentStance = stances[stanceKey];
  const otherStanceKey = Object.keys(stances).find(key => key !== stanceKey);
  const oppositeStance = stances[otherStanceKey];
  
  console.log('Stance processing:', {
    stanceKey,
    currentStance,
    otherStanceKey,
    oppositeStance
  });

  const wordList = personality === 'creative' ? creativeWords : conservativeWords;
  
  const basePrompt = createBasePrompt(currentStance, oppositeStance);
  const personalityPrompt = createPersonalityPrompt(currentStance, personality, wordList);
  
  console.log('Generated prompts:', {
    basePrompt,
    personalityPrompt
  });

  const exampleConversation = fewshotExamples[
    stanceKey === 'freedom' ? 'freedomOfSpeech' : 'userSafety'
  ][personality][0];

  if (model === 'gpt') {
    // GPT
    return {
      systemPrompt: `${basePrompt} ${personalityPrompt}`,
      exampleExchange: exampleConversation
    };
  } else {
    // Gemini
    const geminiPrompt = `TASK AND PERSONALITY:
    ${basePrompt}
    
    PERSONALITY STYLE:
    ${personalityPrompt}`;

    return {
      systemPrompt: geminiPrompt,
      exampleExchange: exampleConversation
    };
  }
};