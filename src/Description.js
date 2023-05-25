import React from "react";
import "./Description.css";


const DescriptionView = ({ bookInfo, handleChange, nextStep }) => {
   
  
  return (
    <div className="container-form">
      <p className="form-title">Poem Book Writer</p>

      <div className="form-element">
        <label className="label-input">Title</label>
        <input
          className="input-single"
          type="text"
          name="title"
          value={bookInfo.title}
          onChange={handleChange}
        />
      </div>

      <div className="form-element">
        <label className="label-input">Subtitle</label>
        <textarea
          className="input-multiple"
          type="text"
          name="description"
          value={bookInfo.description}
          onChange={handleChange}
        />
      </div>

      <div className="form-element">
        <label className="label-input">Audience</label>
        <input
          className="input-single"
          type="text"
          name="audienceInfo"
          value={bookInfo.audienceInfo}
          onChange={handleChange}
        />
      </div>

      <div className="form-element">
        <label className="label-input">Number of Books</label>
        <input
          className="input-single"
          type="number"
          name="numBooks"
          value={bookInfo.numBooks}
          onChange={handleChange}
        />
      </div>

      <div className="form-element">
        <label className="label-input">Number of Chapters (per Book)</label>
        <input
          className="input-single"
          type="number"
          name="numChapters"
          value={bookInfo.numChapters}
          onChange={handleChange}
        />
      </div>

      <div className="form-element">
        <label className="label-input">Number of Concepts (Per Chapter)</label>
        <input
          className="input-single"
          type="number"
          name="numConcepts"
          value={bookInfo.numConcepts}
          onChange={handleChange}
        />
      </div>

      <div className="form-element">
        <label className="label-input">Number of Titles (per Concept)</label>
        <input
          className="input-single"
          type="number"
          name="numTitles"
          value={bookInfo.numTitles}
          onChange={handleChange}
        />
      </div>

      <div className="form-element">
        <label className="label-input">Author</label>
        <select
          className="input-single"
          name="authorName"
          value={bookInfo.author}
          onChange={handleChange}
        >
          <option value="Fred Bloor">Fred Bloor</option>
          <option value="Emily Jacket">Emily Jacket</option>
          <option value="Jaxxen Rivers">Jaxxen Rivers</option>
          <option value="Stoner Sam">Stoner Sam</option>
        </select>
      </div>
  
        <div className="form-element">
          <label className="label-input">Agent Info</label>
          <textarea
            className="input-multiple"
            name="additionalText"
            rows="5"
            value={bookInfo.agentInfo}
            onChange={handleChange}
          >          </textarea>
        </div>
  
        <div className="form-element-bottom">
          <button className="button-form" type="button" onClick={nextStep}>
            Outline
          </button>
        </div>
      </div>
    );
  };
  

export default DescriptionView;
