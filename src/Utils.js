/* eslint-disable */
// This function returns the result of a single prompt submitted to the gpt-3.5-turbo API.
// The result is given as a promise that must be resolved.



function fetchPromptResult(prompt, messages,) {
    let url = "https://api.openai.com/v1/chat/completions";
    let apiKey = process.env.REACT_APP_OPENAI_API_KEY;

    let headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        };

    let model = "gpt-3.5-turbo";
    
    let data = {
        "model": model,
        "messages": messages,
        "max_tokens": 3800,
        "temperature": 0.3,
    };
    console.log("Priming Sequence to OpenAI: ", messages)


    let payload = {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data)
    };

    return fetch(url, payload)
  .then(response => {
    if (!response.ok) {
      throw new Error(`Fetch error: ${response.status}`);
    }
    return response.json();
  }).then(data => {
    console.log("Received data: ", data);
    if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      return data.choices[0].message.content;
    } else {
      throw new Error("Invalid API response");
    }
  })
  .catch(error => {
    console.error("Error when calling the OpenAI API", error);
  });

}


// This function parses a string containing the outline of a book (chapters, sections and items) and returns an object with the chapters, sections and items in 1D, 2D, 3D arrays.
function parseOutline(result) {
    let chapters = []; // Contains the list of the chapters // Books 
    let sections = []; // 2D array containing the sections of each chapter //Chapters
    let items = []; // 3D array containing the items of each section of each chapter // Concepts 
    let parts = []; // 4D array containing the parts of each item of each section of each chapter // Content Titles
    let content = []; // 4D array containing the content corresponding to each part of each item of each section of each chapter // GENERATED Content
    
    let currentChapter = -1; // Index of the current chapter
    let currentSection = -1; // Index of the current section
    let lines = result.split("\n");
    // We ignore all the lines preceding the "# Outline"
    let outlineIndex = lines.findIndex(line => line.startsWith("# Outline"));
    lines = lines.slice(outlineIndex+1);
    for (let i = 0; i < lines.length; i++) {
        // Remove leading and trailing spaces, and tabs
        let line = lines[i].trim();
        line = line.replace(/\t/g, "");
        if (line !== "") {

            if (line.startsWith("Book")) { // If the line starts with "Chapter"
                currentChapter++;
                currentSection = -1;
                sections.push([]); // Add a new array for the sections of the new chapter
                items.push([]); // Add a new array for the items of the new chapter
                parts.push([]); // Add a new array for the parts of the new chapter
                content.push([]); // Add a new array for the content of the new chapter

                // Capture the title of the chapter using regex
                // Match "Chapter 1. Introduction" or "Chapter 1: Introduction"
                let chapterTitle = line.match(/Book\s\d+\.\s(.*)/)[1];
                chapters.push(chapterTitle);
            }
            else if (line.startsWith("Chapter")) { // If the line starts with "Section"
                currentSection++;
                items[currentChapter].push([]); // Add a new array for the items of the new section
                parts[currentChapter].push([]); // Add a new array for the parts of the new section
                content[currentChapter].push([]); // Add a new array for the content of the new section
                // Capture the title of the section using regex
                // Match "Section 1. Overview" or "Section 1: Overview"
                let sectionTitle = line.match(/Chapter\s\d+\.\s(.*)/)[1];
                sections[currentChapter].push(sectionTitle);
            }
            else if (line.startsWith("-")) { // If the line starts with "-"
                items[currentChapter][currentSection].push(line.substring(1));
                parts[currentChapter][currentSection].push([""]); // Add a new array for the parts of the new item
                content[currentChapter][currentSection].push([""]); // Add a new array for the content of the new item
            }
        }
    }

    return { chapters, sections, items, parts, content };
    
}

// This function parses a string containing different parts of a book item and returns an array with the parts.
function parseParts(result) {
  let parts = [];
  let lines = result ? result.split("\n") : [];
  
  // Remove the first and last lines of the array
  lines.shift();
  lines.pop();
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i] ? lines[i].trim().replace(/^-/, "") : "";
    if (line && line !== '{}') {
      parts.push(line);
    }
  }
  
  return parts;
}





export default {fetchPromptResult, parseOutline, parseParts};
/* eslint-enable */