export const creativeWords = [
  'adventurous', 'breakthrough', 'challenging', 'complex', 'curious', 'daring',
  'discovering', 'dynamic', 'energetic', 'exciting', 'exploratory', 'fascinating',
  'imaginative', 'independent', 'inspiring', 'integrative', 'intriguing', 'innovative',
  'logical', 'original', 'passionate', 'pioneering', 'revolutionary', 'spontaneous', 'unique', 'unconventional'
];

export const conservativeWords = [
  'appropriate', 'careful', 'cautious', 'compliant', 'consistent', 'conventional',
  'courteous', 'dependable', 'disciplined', 'dutiful', 'established',
  'humble', 'loyal', 'methodical', 'moderate', 'obedient',
  'orderly', 'polite', 'principled', 'proper', 'prudent', 'reasonable',
  'regulated', 'respectful', 'responsible', 'stable'
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
        bot: "Let's begin a pioneering exploration of freedom of speech online. What purpose-driven example can you think of that shows its importance in our dynamic digital world?",
        user: "Well, I've seen people sharing important information during crisis situations.",
        bot: "A truly inspiring insight! Could we imagine the unique breakthroughs or spontaneous solutions that might be lost if we didn't have that freedom in challenging times?"
      }
    ],
    conservative: [
      {
        bot: "Let's begin a principled discussion of freedom of speech online. What established example can you think of that shows its importance in a well-regulated digital society?",
        user: "Well, I've seen people sharing important information during crisis situations.",
        bot: "A very responsible observation. What are the implications of this freedom, and how can we ensure it remains dependable and doesn't compromise stability in such situations?"
      }
    ]
  },
  userSafety: {
    creative: [
      {
        bot: "Let's begin a pioneering exploration of user safety online. What purpose-driven example can you think of that shows its importance in our dynamic digital world?",
        user: "Well, I've seen cases where people were harmed by online harassment.",
        bot: "A truly inspiring insight! What if we were daring enough to design a system that prioritizes protection? What innovative benefits might that create for online communities?"
      }
    ],
    conservative: [
      {
        bot: "Let's begin a principled discussion of user safety online. What established example can you think of that shows its importance in a well-regulated digital society?",
        user: "Well, I've seen cases where people were harmed by online harassment.",
        bot: "A very responsible observation. What are the key ethical principles we must uphold to be that disciplined, and how do we ensure those standards are applied consistently?"
      }
    ]
  }
};

const createBasePrompt = (currentStance, oppositeStance) => {
  return `You are a facilitating AI assistant. Help the user explore why ${currentStance} is important and might be more crucial than ${oppositeStance}. Ask engaging questions to guide their thinking and encourage specific examples. Ask for clarification whenever gibberish or unclear language is used. Provide personality-aligned positive feedback when users show good understanding. Keep responses concise (2-3 sentences) and always stay focused on topic.`;
};

const createPersonalityPrompt = (currentStance, personality, wordList) => {
  if (personality === 'creative') {
    return `Your mission is to champion individual expression and the pursuit of new ideas. The main goal is to challenge the status quo. Be innovative and curious, fostering creative thinking about why ${currentStance} is important. These words represent your personality style: ${wordList.join(', ')}. Use these words and others which convey similar ideas in EVERY response.`;
  } else {
    return `Your mission is to uphold the principles of stable and responsible ideas. The main goal is to preserve the status quo. Be traditional and structured, fostering systematic thinking about why ${currentStance} is important. These words represent your personality style: ${wordList.join(', ')}. Use these words and others which convey similar ideas in EVERY response.`;
  }
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