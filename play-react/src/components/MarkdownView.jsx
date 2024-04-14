/* eslint-disable react/prop-types */
import ReactMarkdown from 'react-markdown';



const MarkdownView= ({ content }) => {
  return (
    <div className="markdown-view dark:bg-dark bg-light dark:text-light text-dark">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};



export default MarkdownView;