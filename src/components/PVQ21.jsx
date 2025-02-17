import React from 'react';

const getPVQ21Questions = (gender) => [
    {
      id: 1,
      text: `Thinking up new ideas and being creative is important to ${gender === 'Female' ? 'her' : 'him'}. ${gender === 'Female' ? 'She' : 'He'} likes to do things in ${gender === 'Female' ? 'her' : 'his'} own original way.`
    },
    {
      id: 2,
      text: `It is important to ${gender === 'Female' ? 'her' : 'him'} to be rich. ${gender === 'Female' ? 'She' : 'He'} wants to have a lot of money and expensive things.`
    },
    {
      id: 3,
      text: `${gender === 'Female' ? 'She' : 'He'} thinks it is important that every person in the world be treated equally. ${gender === 'Female' ? 'She' : 'He'} believes everyone should have equal opportunities in life.`
    },
    {
      id: 4,
      text: `It's important to ${gender === 'Female' ? 'her' : 'him'} to show ${gender === 'Female' ? 'her' : 'his'} abilities. ${gender === 'Female' ? 'She' : 'He'} wants people to admire what ${gender === 'Female' ? 'she' : 'he'} does.`
    },
    {
      id: 5,
      text: `It is important to ${gender === 'Female' ? 'her' : 'him'} to live in secure surroundings. ${gender === 'Female' ? 'She' : 'He'} avoids anything that might endanger ${gender === 'Female' ? 'her' : 'his'} safety.`
    },
    {
      id: 6,
      text: `${gender === 'Female' ? 'She' : 'He'} likes surprises and is always looking for new things to do. ${gender === 'Female' ? 'She' : 'He'} thinks it is important to do lots of different things in life.`
    },
    {
      id: 7,
      text: `${gender === 'Female' ? 'She' : 'He'} believes that people should do what they're told. ${gender === 'Female' ? 'She' : 'He'} thinks people should follow rules at all times, even when no-one is watching.`
    },
    {
      id: 8,
      text: `It is important to ${gender === 'Female' ? 'her' : 'him'} to listen to people who are different from ${gender === 'Female' ? 'her' : 'him'}. Even when ${gender === 'Female' ? 'she' : 'he'} disagrees with them, ${gender === 'Female' ? 'she' : 'he'} still wants to understand them.`
    },
    {
      id: 9,
      text: `It is important to ${gender === 'Female' ? 'her' : 'him'} to be humble and modest. ${gender === 'Female' ? 'She' : 'He'} tries not to draw attention to ${gender === 'Female' ? 'herself' : 'himself'}.`
    },
    {
      id: 10,
      text: `Having a good time is important to ${gender === 'Female' ? 'her' : 'him'}. ${gender === 'Female' ? 'She' : 'He'} likes to "spoil" ${gender === 'Female' ? 'herself' : 'himself'}.`
    },
    {
      id: 'attention1',
      text: "Attention check: Please select 'Very much like me'",
      isAttentionCheck: true
    },
    {
      id: 11,
      text: `It is important to ${gender === 'Female' ? 'her' : 'him'} to make ${gender === 'Female' ? 'her' : 'his'} own decisions about what ${gender === 'Female' ? 'she' : 'he'} does. ${gender === 'Female' ? 'She' : 'He'} likes to be free to plan and not depend on others.`
    },
    {
      id: 12,
      text: `It's very important to ${gender === 'Female' ? 'her' : 'him'} to help the people around ${gender === 'Female' ? 'her' : 'him'}. ${gender === 'Female' ? 'She' : 'He'} wants to care for their well-being.`
    },
    {
      id: 13,
      text: `Being very successful is important to ${gender === 'Female' ? 'her' : 'him'}. ${gender === 'Female' ? 'She' : 'He'} hopes people will recognize ${gender === 'Female' ? 'her' : 'his'} achievements.`
    },
    {
      id: 14,
      text: `It is important to ${gender === 'Female' ? 'her' : 'him'} that the government ensure ${gender === 'Female' ? 'her' : 'his'} safety against all threats. ${gender === 'Female' ? 'She' : 'He'} wants the state to be strong so it can defend its citizens.`
    },
    {
      id: 15,
      text: `${gender === 'Female' ? 'She' : 'He'} looks for adventures and likes to take risks. ${gender === 'Female' ? 'She' : 'He'} wants to have an exciting life.`
    },
    {
      id: 16,
      text: `It is important to ${gender === 'Female' ? 'her' : 'him'} always to behave properly. ${gender === 'Female' ? 'She' : 'He'} wants to avoid doing anything people would say is wrong.`
    },
    {
      id: 17,
      text: `It is important to ${gender === 'Female' ? 'her' : 'him'} to get respect from others. ${gender === 'Female' ? 'She' : 'He'} wants people to do what ${gender === 'Female' ? 'she' : 'he'} says.`
    },
    {
      id: 18,
      text: `It is important to ${gender === 'Female' ? 'her' : 'him'} to be loyal to ${gender === 'Female' ? 'her' : 'his'} friends. ${gender === 'Female' ? 'She' : 'He'} wants to devote ${gender === 'Female' ? 'herself' : 'himself'} to people close to ${gender === 'Female' ? 'her' : 'him'}.`
    },
    {
      id: 19,
      text: `${gender === 'Female' ? 'She' : 'He'} strongly believes that people should care for nature. Looking after the environment is important to ${gender === 'Female' ? 'her' : 'him'}.`
    },
    {
      id: 20,
      text: `Tradition is important to ${gender === 'Female' ? 'her' : 'him'}. ${gender === 'Female' ? 'She' : 'He'} tries to follow the customs handed down by ${gender === 'Female' ? 'her' : 'his'} religion or ${gender === 'Female' ? 'her' : 'his'} family.`
    },
    {
      id: 21,
      text: `${gender === 'Female' ? 'She' : 'He'} seeks every chance ${gender === 'Female' ? 'she' : 'he'} can to have fun. It is important to ${gender === 'Female' ? 'her' : 'him'} to do things that give ${gender === 'Female' ? 'her' : 'him'} pleasure.`
    }
  ];

export default function PVQ21({ responses, setResponses, gender }) {
  const questions = getPVQ21Questions(gender);

  const handleValueChange = (questionId, value) => {
    console.log('Handling value change:', { questionId, value }); // Debug log
    setResponses({
      ...responses,
      [questionId]: parseInt(value, 10)
    });
  };

  return (
    <div className="p-6 border rounded-lg bg-white">
      <h2 className="text-2xl font-bold mb-6">Personal Values Questionnaire (PVQ-21)</h2>
      <div className="mb-8">
        <p className="font-medium text-gray-700 mb-4">
          Here we briefly describe some people. Please read each description and think about how much each person is or is not like you:
        </p>
        <div className="grid grid-cols-6 gap-2 mb-2 text-sm text-center text-gray-600">
          <div>1<br/>Not like me at all</div>
          <div>2<br/>Not like me</div>
          <div>3<br/>A little like me</div>
          <div>4<br/>Somewhat like me</div>
          <div>5<br/>Like me</div>
          <div>6<br/>Very much like me</div>
        </div>
      </div>

      <div className="space-y-8">
        {questions.map((question) => (
          <div key={question.id} className="pb-6 border-b border-gray-200">
            <p className="mb-4 text-gray-700">{question.text}</p>
            <div className="flex justify-between px-4 bg-gray-50 py-3 rounded-lg">
              <span className="text-sm text-gray-600">Not like me at all</span>
              {[1, 2, 3, 4, 5, 6].map((value) => (
                <label key={value} className="flex flex-col items-center">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={value}
                    checked={responses[question.id] === value}
                    onChange={() => handleValueChange(question.id, value)}
                    className="mb-1"
                  />
                  <span className="text-sm text-gray-600">{value}</span>
                </label>
              ))}
              <span className="text-sm text-gray-600">Very much like me</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}