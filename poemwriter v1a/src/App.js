// This is the main component of the app. It handles the state of the app and renders the appropriate view based on the currentView state.
/* eslint-disable */
import React, { useState } from 'react';
import DescriptionView from './Description';
import OutlineView from './Outline';
import ContentGenerationView from './ContentGeneration';
import IntroGenerationView from './IntroGeneration';
import Utils from './Utils';
import * as fs from 'fs'
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun, Header } from "docx";
import './App.css';



function App() {
	const [book, setBook] = useState({
		title: 'Mathematics of quantitative finance',
		description:'Written for STEM students and professionals, this book provides extensive coverage of the mathematics of quantitative finance.',
		rawOutline:'',
		chapters:["Example chapter"], // Array of strings containing the names of the chapters
		agentInfo:'',
		authorName:'',
		numBooks:'',
		numChapters:'',
		numConcepts:'',
		numTitles:'',
		audienceInfo:'',
		typeBook: 'Collection Of Poems',
		sections: [["Click 'Generate' to generate outline"]], // 2D array containing the names of the sections of each chapter
		items: [[["Some item"]]], // 3D array containing the names of the items of each section of each chapter
		parts: [[[[""]]]], // 4D array containing the names of the parts of each item of each section of each chapter
		content: [[[[""]]]], // 4D array containing the content corresponding to each part of each item of each section of each chapter
		isGenOutline: false,
		isGenParts: false,
		isGenContent: false,
		selectedChapter: null,
		selectedSection: null,
		selectedItem: null,
		selectedPart: null,
		
	});
	const [currentView, setCurrentView] = useState(0);

	// Generate the outline of the book (chapters, sections, items) ====================================================================
	const generateOutline = async () => {
		let  prompt = `Please generate the outline for the Book Names, Chapters Per Book and concepts per chapter. The Main title is: ${book.title}'.\n`;
		prompt += `The description of the series is: '${book.description}'\n`;
		prompt += `The audience is: '${book.audienceInfo}'.\n`;
		prompt += `There are ${book.numBooks} in the series. \n`;
		prompt += `There are ${book.numChapters} Chapters in the book !This is Important. \n`;
		prompt += `Each Chapter has ${book.numConcepts} items \n`;
		prompt += "A concept in this case, is a high-level story idea"
		prompt += "The result should be formatted as follows:\n";
		prompt += "# Outline\n";
		prompt += "Book 1. First book's name\n";
		prompt += "\tChapter 1. Title of Chapter 1 of Book 1\n"; // Use of \t for indentation in case VSCode converts tabs to spaces
		prompt += "\t\t-Concept 1.\n";
		prompt += "\t\t-Concept 2.\n";
		prompt += "\t\t-Concept 3.\n";
		prompt += "\t\t-\n";


		
		console.log("Prompt: ", prompt)
		setBook({
			...book,
			isGenOutline: true,
		});
		const messages = [
			{"role": "system", "content":`${book.agentInfo}. Please write from their perspective but do not give away your identity.`},
			{"role": "user", "content": `You are going to receive a title, description, and number of books, chapters, and concepts per chapter to generate. A 'concept' is an idea, feeling, situation, emotion, thought or prompt that the audience would relate to.`},
			{"role": "assistant", "content": "Got it, let's go."},
			{"role": "user", "content": prompt}
		  ];


		const resultPromise = Utils.fetchPromptResult(prompt, messages, book);
		resultPromise.finally(() => {
			console.log("Request done.");
			setBook({
				...book,
				isGenOutline: false,
			});
		});
		let result = await resultPromise;
		// Remove all the lines before and including "Outline"
		result = result.split("# Outline")[1];
		console.log("Raw outline: ", result)
		setBook({
			...book,
			rawOutline: result,
		});
	};

	// Parse the raw text into the outline
	const parseOutline = () => {
		let parsedOutline = Utils.parseOutline(book.rawOutline);
		console.log("Parsed outline: ", parsedOutline)
		setBook({
			...book,
			chapters: parsedOutline.chapters,
			sections: parsedOutline.sections,
			items: parsedOutline.items,
			parts: parsedOutline.parts,
			content: parsedOutline.content,
			selectedChapter: null,
			selectedSection: null,
			selectedItem: null,
			selectedPart: null,
		});
	};

	
	  
	// Generate the parts of the selected item ====================================================================
	const generateParts = async () => {
		let prompt = `The book's name is "${book.title}".\n`;
		prompt += `The description of the book is "${book.description}"\n\n`;
		prompt += `Here is the subsection we are interested in:\n`;
		prompt += `Book ${book.selectedChapter + 1}. ${book.chapters[book.selectedChapter]}\n`;
		prompt += `\tChapter ${book.selectedSection + 1}. ${book.sections[book.selectedChapter][book.selectedSection]}\n`;
		prompt += `\t\tConcept ${book.selectedItem + 1}. ${book.items[book.selectedChapter][book.selectedSection][book.selectedItem]}\n\n`;
		prompt += `From the perspective of '${book.agentInfo}', Give me ${book.numTitles} of the titles that could be written about the concept: "${book.items[book.selectedChapter][book.selectedSection][book.selectedItem]}".\n`;
		prompt += `The result should be formatted as follows \n`;
		prompt += `-"Title 1."\n`;
		prompt += `-"Title 2"\n`;
		prompt += `-"Title 3"\n`;
		prompt += `...\n`;
		
		console.log("Prompt: ", prompt)
		setBook({
			...book,
			isGenParts: true,
		});
		// SYSTEM MESSAGES FOR PRIMING SEQUENCE
		const messages = [
			{"role": "system", "content": `${book.agentInfo}`},
			{"role": "user", "content": `You are going to receive some Concepts and you are to write creative titles for those concepts that would resonate with ${book.audienceInfo}. The titles should be from the perspective of you and should be wrapped in quotes. Keep your title brief and unique`},
			{"role": "assistant", "content": "Got it, I will be direct and leave out extra commentary, other than the requested text."},
			{"role": "user", "content": prompt}
		  ];

		const resultPromise = Utils.fetchPromptResult(prompt, messages);
		resultPromise.finally(() => {
			console.log("Request done.");
			setBook({
				...book,
				isGenParts: false,
			});
		});
		let result = await resultPromise;
		let parsedParts = Utils.parseParts(result); // Returns an array with the parts of the selected item
		console.log("Parsed parts: ", parsedParts)

		// We update the book object with the new parts. book.parts is a 4D array, so we need to update the parts of the selected item.
		// We use the spread operator to copy the array, and then we update the selected item's parts.
		let newParts = [...book.parts];
		newParts[book.selectedChapter][book.selectedSection][book.selectedItem] = parsedParts;
		setBook({
			...book,
			parts: newParts,
			selectedPart: null,
		});
	};

	// Inject Intro / Conclusion After Content Has been Generated ==============================================================


	function injectIntroductionAndConclusion() {
		// Make copies of the book arrays using the spread operator
		let newChapters = [...book.chapters];
		let newSections = [...book.sections];
		let newItems = [...book.items];
		let newParts = [...book.parts];
		let newContent = [...book.content];
	  
		// Add new section and item for introduction
		newSections[0].unshift("Introduction");
		newItems[0].unshift(["Introduction"]);
		newParts[0].unshift([["Introduction"]]);
		newContent[0].unshift([["Introduction Content"]]);
	  
		// Add new section and item for conclusion
		newSections[newSections.length - 1].push("Conclusion");
		newItems[newItems.length - 1].push(["Conclusion"]);
		newParts[newParts.length - 1].push([["Conclusion"]]);
		newContent[newContent.length - 1].push([["Conclusion Content"]]);
		
	  
	  
		// Update the book object with the new arrays
		setBook({
		  ...book,
		  chapters: newChapters,
		  sections: newSections,
		  items: newItems,
		  parts: newParts,
		  content: newContent
		});
	  }
	  

	// Generate the The introductions of the selected part ====================================================================


	const genIntroOutro = async () => {
		setBook({
		  ...book,
		  isGenContentAllParts: true,
		});
	  
		let newContent = [...book.content];
		let lastSectionIndex = book.parts.length - 1;
	  
		// Generate content for the first part of the first item in the first section
		book.selectedChapter = 0;
		book.selectedSection = 0;
		book.selectedItem = 0;
		book.selectedPart = 0;
		await generateContent();
	  
		// Loop through all the sections and generate content for "0 0 0 0" parts
		for (let sectionIndex = 0; sectionIndex <= lastSectionIndex; sectionIndex++) {
		  let section = book.parts[sectionIndex];
		  let lastItemIndex = section.length - 1;
	  
		  for (let itemIndex = 0; itemIndex <= lastItemIndex; itemIndex++) {
			let item = section[itemIndex];
	  
			// Check if the item has the parts array defined
			if (item && item.parts) {
			  let lastPartIndex = item.parts.length - 1;
	  
			  if (item.parts[0] === 0 && item.parts[1] === 0 && item.parts[2] === 0 && item.parts[3] === 0) {
				book.selectedSection = sectionIndex;
				book.selectedItem = itemIndex;
				book.selectedPart = 0;
				await generateContent();
			  }
	  
			  if (item.parts[0] === 0 && item.parts[2] === 0 && item.parts[3] === 0) {
				// Get the index of the last part in the item
				let lastPartIndex = item.parts.length - 1;
				let lastPartValue = item.parts[lastPartIndex];
	  
				if (lastPartValue === lastPartIndex) {
				  book.selectedSection = sectionIndex;
				  book.selectedItem = itemIndex;
				  book.selectedPart = 0;
				  await generateContent();
				}
			  }
			}
		  }
		}
	  
		setBook({
		  ...book,
		  content: newContent,
		  isGenContentAllParts: false,
		});
	  };
	  
	  
	
		
	
	  // Select Items ===============================

	const selectItem = (chapterIndex, sectionIndex, itemIndex) => {
		console.log("Selecting item: ", chapterIndex, sectionIndex, itemIndex);
		setBook({
			...book,
			selectedChapter: chapterIndex,
			selectedSection: sectionIndex,
			selectedItem: itemIndex,
			selectedPart: null,
		});
	};
// SELECT PART ===================================================
	const selectPart = (partIndex) => {
		console.log("Selecting part: ", partIndex);
		setBook({
			...book,
			selectedPart: partIndex,
		});
	};	
// Delete Parts 
	const deletePart = (partIndex) => {
		console.log("Deleting part: ", partIndex);
		let newParts = [...book.parts];
		newParts[book.selectedChapter][book.selectedSection][book.selectedItem].splice(partIndex, 1);
		let newContent = [...book.content];
		newContent[book.selectedChapter][book.selectedSection][book.selectedItem].splice(partIndex, 1);
		setBook({
			...book,
			parts: newParts,
			content: newContent,
			selectedPart: null,
		});
	};
// GENERATE CONTENT SINGLE =========================================================================


	const generateContent = async () => {
		let prompt = `The book's name is "${book.title}".\n`;
		prompt += `The description of the book is "${book.description}"\n\n`;
		prompt += `From the perspective of '${book.agentInfo}', Write the poem for the following part of the book:\n`;
		prompt += `-${book.parts[book.selectedChapter][book.selectedSection][book.selectedItem][book.selectedPart]}\n`;
		prompt += `The POEM MUST BE CREATIVE! and only putput the poem. No additional commentary or titles as the title is in another column already.\n`;

		console.log("Prompt: ", prompt)
		setBook({
			...book,
			isGenContent: true,
		});
		// SYSTEM MESSAGES FOR GENERATE CONTENT PRIMING SEQEUNCE
		const messages = [
			{"role": "system", "content": `${book.agentInfo}`},
			{"role": "user", "content": `You are writing a piece of poetry that is advanced in method and reading level. You are going to recieve a poem title and you will write the content for that title. But remember, only write the content and not the title.`},
			{"role": "assistant", "content": `Got it. I will write a poem and write only the content and not the title. I will write create and advanced poetry and not add any additional commentary into the response. let's write.`},
			{"role": "user", "content": prompt}
		  ];
		  console.log("Priming Sequence: ", messages)

		const resultPromise = Utils.fetchPromptResult(prompt, messages);
		resultPromise.finally(() => {
			console.log("Request done.");
			setBook({
				...book,
				isGenContent: false,
			});
		});
		let result = await resultPromise;
		console.log("Result: ", result)

		// We update the book object with the new content. book.content is a 4D array, so we need to update the content of the selected part.
		// We use the spread operator to copy the array, and then we update the selected part's content.
		let newContent = [...book.content];
		newContent[book.selectedChapter][book.selectedSection][book.selectedItem][book.selectedPart] = result;
		setBook({
			...book,
			content: newContent,
		});
	};
	
	
	// Generate All Parts In The Section =======================================================
	
	const generateAllParts = async () => {
		setBook({
		  ...book,
		  isGenAllParts: true,
		});
	  
		let newParts = [...book.parts];
		let newContent = [...book.content];
	  
		// Loop over each chapter, section, and item in the book and generate its parts
		for (let i = 0; i < book.chapters.length; i++) {
		  for (let j = 0; j < book.sections[i].length; j++) {
			for (let k = 0; k < book.items[i][j].length; k++) {
			  // Only generate parts for the selected item
			  if (i === book.selectedChapter && j === book.selectedSection && k === book.selectedItem) {
				continue;
			  }
	  
			  let prompt = `The book's name is "${book.title}".\n`;
			  prompt += `The description of the book is "${book.description}"\n\n`;
			  prompt += `Here is the subsection we are interested in:\n`;
			  prompt += `Book ${i + 1}. ${book.chapters[i]}\n`;
			  prompt += `\tChapter ${j + 1}. ${book.sections[i][j]}\n`;
			  prompt += `\t\tConcept ${k + 1}. ${book.items[i][j][k]}\n\n`;
			  prompt += `From the perspective of '${book.agentInfo}', Give me ${book.numTitles} of the titles that should be included in the concept "${book.items[i][j][k]}".\n`;
			  prompt += `The result should be formatted as follows and wrapped in quotes:\n`;
			  prompt += `-"Title 1"\n`;
			  prompt += `-"Title 2"\n`;
			  prompt += `-"Title 3"\n`;
			  prompt += `...\n`;
			  
			  const messages = [
				{"role": "system", "content": `${book.agentInfo}`},
				{"role": "user", "content": `You are writing a piece of poetry that is advanced in method and reading level. You will recieve a concept and you are to write a title that would go with that concept and resonate with Demographic:{'${book.audienceInfo}.}'`},
				{"role": "assistant", "content": "Got it, let's go."},
				{"role": "user", "content": prompt}
			  ];
	  
			  console.log(`Prompt for Chapter ${i + 1}: ${book.chapters[i]}\nSection ${j + 1}: ${book.sections[i][j]}\nConcept ${k + 1}: ${book.items[i][j][k]}`);
			  console.log(`Prompt:\n${prompt}`);
	  
			  const result = await Utils.fetchPromptResult(prompt, messages);
	  
			  console.log(`Result for Chapter ${i + 1}: ${book.chapters[i]}\nSection ${j + 1}: ${book.sections[i][j]}\nConcept ${k + 1}: ${book.items[i][j][k]}`);
			  console.log(`Result:\n${result}`);
	  
			  const parsedParts = Utils.parseParts(result); // Returns an array with the parts of the selected item
	  
			  console.log(`Parsed parts for Chapter ${i + 1}: ${book.chapters[i]}\nSection ${j + 1}: ${book.sections[i][j]}\nConcept ${k + 1}: ${book.items[i][j][k]}`);
			  console.log(`Parsed parts:\n${JSON.stringify(parsedParts, null, 2)}`);
	  
			  // Update the parts and content arrays with the new parts
			  newParts[i][j][k] = parsedParts;
			  newContent[i][j][k] = parsedParts.map(part => null);
			}
		  }
		}
	  
		setBook({
		  ...book,
		  parts: newParts,
		  content: newContent,
		  isGenAllParts: false,
		  selectedPart: null,
		});
	  };
	  
	// Generate Content For All Parts in Section ===========================================================================

	const genContentAllParts = async () => {
		setBook({
		  ...book,
		  isGenContentAllParts: true,
		});
	  
		let newContent = [...book.content];
	  
		// Loop over each chapter, section, and item in the selected section and generate content for each part
		for (let i = 0; i < book.parts[book.selectedChapter][book.selectedSection][book.selectedItem].length; i++) {
		  book.selectedPart = i;
		  await generateContent(); // Call the existing `generateContent` function for each part
		  newContent = [...book.content];
		}
	  
		setBook({
		  ...book,
		  content: newContent,
		  isGenContentAllParts: false,
		});
	  };
	  
// Generate Content For Every Part in Every Section (GENERATE THE WHOLE BOOK) ======================================================================

const genContentAll = async () => {
	const totalParts = book.parts.flat(2).length;
	let newContent = [...book.content];
	setBook({
	  ...book,
	  isGenContentAll: true,
	  isGenParts: true,
	  isGenContent: true,
	});
  
	// Generate all parts for the book first
	await generateAllParts();
  
	let partsGenerated = 0;
	let partsSkipped = 0;
	// Loop over each chapter, section, item, and part in the book
	for (let i = 0; i < book.chapters.length; i++) {
	  for (let j = 0; j < book.sections[i].length; j++) {
		for (let k = 0; k < book.items[i][j].length; k++) {
		  for (let l = 0; l < book.parts[i][j][k].length; l++) {
			book.selectedChapter = i;
			book.selectedSection = j;
			book.selectedItem = k;
			book.selectedPart = l;
  
			// Skip part if it already has content
			if (book.content[i][j][k][l]) {
			  partsSkipped++;
			  console.log(`Part ${l+1} of Item ${k+1} in Section ${j+1} of Chapter ${i+1} skipped (already has content)`);
			  continue;
			}
  
			// Generate content for each part and update progress
			console.log(`Generating part ${l+1} of ${book.parts[i][j][k].length} in item ${k+1} of section ${j+1} in chapter ${i+1}...`);
			await generateContent();
			partsGenerated++;
			const progress = Math.floor((partsGenerated / totalParts) * 100);
			console.log(`Progress: ${progress}% \x1b[32m(${partsGenerated}/${totalParts})\x1b[0m`);
			
			newContent = [...book.content];
		  }
		}
	  }
	}
	for (let i = 0; i < 15; i++) {
		console.log("BOOK DONE MOTHERFUCKER!!!");
	  }
		  
  
	setBook({
	  ...book,
	  content: newContent,
	  isGenContentAll: false,
	  isGenContent: false,
	  isGenParts: false,

	});
  };
  
  
  
  




// This function handles onChange on the input fields of the DescriptionView component
const updateBook = (event) => {
  const { name, value } = event.target;
  const preGeneratedText = {
    'Fred Bloor': 'You are Fred, a gruesome horror writer who is descriptive and gory in all his creations. You write for an adult audience who seeks out gore and horror as entertainment.',
    'Emily Jacket': 'You are Emily, you are a 42 year old, best-selling poet who is known for her creative use of words, emotions, and concepts and applying them to poetry',
    'Jaxxen Rivers': 'You are Danny, An erotic AI novelist who writes about sexual kinks in a respectful and open way.',
	'Stoner Sam': 'You are Stoner Sam, you write hilarious and funny stories about being high all the time. You are a comedian and hilarious writer.',

  };

  if (name === 'authorName') {
    const agentInfo = value ? preGeneratedText[value] : '';
    setBook((prevState) => ({
      ...prevState,
      authorName: value,
      agentInfo,
    }));
  } else {
    setBook({ ...book, [name]: value });
  }
};


  // SAVE THE FILE IN MARKDOWN

  const savefile = () => {
	console.log('Saving file...');
  
	const { title, description, authorName, chapters, sections, content, parts } = book;
  
	console.log(`Book Title: ${title}`);
	console.log(`Book Description: ${description}`);
	console.log(`Author: ${authorName}`);
	console.log(`Total chapters: ${chapters.length}`);
	console.log(`Total sections: ${sections.flat().length}`);
	console.log(`Total content: ${content.flat(2).length}`);
  
	console.log('Generating markdown...');
  
	let markdown = `# ${title}\n\n`;
	markdown += `**Book Description:** ${description}\n\n`;
	markdown += `**Author:** ${authorName}\n\n`;
  
	chapters.forEach((chapter, chapterIndex) => {
	  markdown += `# Chapter ${chapterIndex + 1}: ${chapter}\n\n`;
  
	  sections[chapterIndex].forEach((section, sectionIndex) => {
		markdown += `## ${section}\n\n`;
  
		const sectionContent = content[chapterIndex][sectionIndex];
  
		sectionContent.forEach((item, itemIndex) => {
		  const partsList = parts[chapterIndex][sectionIndex][itemIndex];
		  const contentList = content[chapterIndex][sectionIndex][itemIndex];
  
		  partsList.forEach((part, partIndex) => {
			const partContent = contentList[partIndex];
  
			markdown += `### ${part}\n\n`;
			markdown += `${partContent}\n\n`;
		  });
		});
	  });
	});
  
	const filename = `${title}.md`;
	const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  
	if (window.navigator.msSaveOrOpenBlob) {
	  window.navigator.msSaveBlob(blob, filename);
	} else {
	  const link = document.createElement('a');
  
	  if (link.download !== undefined) {
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', filename);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	  }
	}
  
	console.log('File saved!');
  };
  
// SAVE FILE IN CSV

function saveCSV() {
	// Flatten out the book data
	const flattened = [];
	for (let i = 0; i < book.chapters.length; i++) {
	  const chapter = book.chapters[i];
	  const sections = book.sections[i];
	  const items = book.items[i];
	  const parts = book.parts[i];
	  const content = book.content[i];
	  for (let j = 0; j < sections.length; j++) {
		const section = sections[j];
		const sectionNum = j + 1;
		for (let k = 0; k < items[j].length; k++) {
		  const item = items[j][k];
		  const itemNum = k + 1;
		  for (let l = 0; l < parts[j][k].length; l++) {
			const part = parts[j][k][l];
			const partNum = l + 1;
			const cellContent = content[j][k][l] || '';
			const rowData = [
				`"${book.title.replace(/"/g, '""')}"`, // Escape double quotes in title
				`"${book.description.replace(/"/g, '""')}"`, // Escape double quotes in description
				`"${book.authorName.replace(/"/g, '""')}"`, // Escape double quotes in author name
				i + 1,
				`"${chapter.replace(/"/g, '""')}"`, // Escape double quotes in chapter name
				sectionNum,
				`"${section.replace(/"/g, '""')}"`, // Surround section name with quotes and escape double quotes
				itemNum,
				`"${item.replace(/"/g, '""')}"`, // Surround item name with quotes and escape double quotes
				partNum,
				`"${part.replace(/"/g, '""')}"`, // Surround part name with quotes and escape double quotes
				`"${cellContent.replace(/"/g, '""')}"` // Surround content with quotes and escape double quotes
			  ];
			  
			flattened.push(rowData);
		  }
		}
	  }
	}
  
	// Prepare the csv content
	let csvContent = '';
	csvContent += 'Title,Description,Author,Chapter #,Chapter Name,Section #,Section Name,Item #,Item Name,Part #,Part Name,Content\n';
	for (let i = 0; i < flattened.length; i++) {
	  const rowData = flattened[i];
	  csvContent += `${rowData.join(',')}\n`;
	}
  
	// Download the csv file
	const filename = `${book.title}.csv`;
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	if (navigator.msSaveBlob) {
	  // For IE
	  navigator.msSaveBlob(blob, filename);
	} else {
	  const link = document.createElement("a");
	  if (link.download !== undefined) {
		// For Chrome, Firefox, Safari, Opera
		const url = URL.createObjectURL(blob);
		link.setAttribute("href", url);
		link.setAttribute("download", filename);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	  }
	}
  }
  

  
  
  
  

  
  
  
  


  
  

  
  

	// Component receive a function as a prop, but needs to pass a chapter, section, and item index to it.
	// const generateContent = (chapterIndex, sectionIndex, itemIndex) => {

	const views = [
		<DescriptionView bookInfo={book} handleChange={updateBook} nextStep={() => {setCurrentView(currentView+1)}} />,
		<OutlineView bookData={book} genOutline={generateOutline} changeOutline={updateBook} parseOutline={parseOutline} previousStep={() => {setCurrentView(currentView-1)}} nextStep={() => {setCurrentView(currentView+1)}}/>,
		<ContentGenerationView bookData={book} previousStep={() => {setCurrentView(currentView-1)}} genParts={generateParts} genContent={generateContent} selectItem={selectItem} selectPart={selectPart} deletePart={deletePart} savefile={savefile} generateAllParts={generateAllParts} genContentAllParts={genContentAllParts} genContentAll={genContentAll} saveCSV={saveCSV} injectIntroductionAndConclusion={injectIntroductionAndConclusion} nextStep={() => {setCurrentView(currentView+1)}} />,
		<IntroGenerationView bookData={book} previousStep={() => {setCurrentView(currentView-1)}} genParts={generateParts} genContent={generateContent} selectItem={selectItem} selectPart={selectPart} deletePart={deletePart} savefile={savefile} generateAllParts={generateAllParts} genContentAllParts={genContentAllParts} genContentAll={genContentAll} saveCSV={saveCSV} injectIntroductionAndConclusion={injectIntroductionAndConclusion} genIntroOutro={genIntroOutro} nextStep={() => {setCurrentView(currentView+1)}}  />,

	];

	return <div className='container-app'>
		{views[currentView]}
	</div>;
}


export default App;
/* eslint-enable */