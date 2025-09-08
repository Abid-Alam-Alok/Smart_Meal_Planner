import React from 'react';
import './MotivationalQuotes.css';

const MotivationalQuotes = () => {
  const quotes = [
    {
      text: "Your body can do it. It's your mind you need to convince.",
      author: "Sarah Mitchell"
    },
    {
      text: "Progress, not perfection.",
      author: "Marcus Thompson"
    },
    {
      text: "The groundwork for all happiness is good health.",
      author: "Leigh Hunt"
    },
    {
      text: "Take care of your body. It's the only place you have to live.",
      author: "Jim Rohn"
    },
    {
      text: "Health is not about the weight you lose, but about the life you gain.",
      author: "Dr. Elena Rodriguez"
    }
  ];

  return (
    <div className="motivational-quotes">
      <h3>💪 Stay Motivated</h3>
      <div className="quotes-container">
        {quotes.map((quote, index) => (
          <div key={index} className="quote-card">
            <p>"{quote.text}"</p>
            <span className="quote-author">- {quote.author}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MotivationalQuotes;