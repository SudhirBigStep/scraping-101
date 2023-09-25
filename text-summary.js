const { PythonShell } = require('python-shell');
// const { passFinalList } = require('./scrape-google-chat');

// Input text for summarization and filtering
// const inputText = `
// Your input text goes here. it is not imprtant adiis.
// Our PM is Narendra Modi.
// It can be a long piece of text that you want to summarize and filter.
// `;


function filterList(req, res, next) {
  const inputList = req.inputList;
    const options = {
    mode: 'text',
    pythonPath: 'python', // Use 'python3' if needed
    pythonOptions: ['-u'], // unbuffered stdout
    scriptPath: __dirname,
    args: [inputList],
  };
  
  const pyshell = new PythonShell('sentiment-analysis.py', options);
    
  // Define a variable to store the received list of text
  let filteredTextList = [];
  
  // Set up an event handler to handle Python output
  pyshell.on('message', (message) => {
    try {
      // Parse the received JSON-encoded string into a JavaScript array
      const parsedTextList = JSON.parse(message);
  
      // Update the receivedTextList variable with the parsed array
      filteredTextList = parsedTextList;
      req.inputList = filteredTextList;
      next();
      // summarizeList(filteredTextList);
  
      // You can now work with receivedTextList as needed
    } catch (error) {
      // Handle parsing errors or other issues
      console.error('Error parsing Python message:', error);
    }
  });
    
  pyshell.send(JSON.stringify(inputList));
  
  pyshell.end((err, code, signal) => {
      if (err) throw err;
      console.log('Python execution finished with code:', code);
      console.log('Python execution finished with signal:', signal);
  //   You can continue to work with it or perform any additional processing
    });
  

  }



function summarizeList(req, res, next) {
  const inputList = req.inputList;
    // console.log('Received list:', inputList);

    const summarizeoptions = {
    mode: 'text',
    pythonPath: 'python', // Use 'python3' if needed
    pythonOptions: ['-u'], // unbuffered stdout
    scriptPath: __dirname,
    args: [inputList],
  };
  
  const summarizepyshell = new PythonShell('summarize.py', summarizeoptions);
    
  // Define a variable to store the received list of text
  let receivedTextList = [];
  
  // Set up an event handler to handle Python output
  summarizepyshell.on('message', (message) => {
    try {
      // Parse the received JSON-encoded string into a JavaScript array
      const parsedTextList = JSON.parse(message);
  
      // Update the receivedTextList variable with the parsed array
      receivedTextList = parsedTextList;
      res.json({ success: true, data: receivedTextList });
  
      // Process the received text list as needed
      console.log('Received text list from Python:', receivedTextList);

      // passFinalList(receivedTextList);
  
    } catch (error) {
      // Handle parsing errors or other issues
      console.error('Error parsing Python message:', error);
    }
  });
    
  summarizepyshell.send(JSON.stringify(inputList));
  
  summarizepyshell.end((err, code, signal) => {
      if (err) throw err;
      console.log('Python execution finished with code:', code);
      console.log('Python execution finished with signal:', signal);
  //   You can continue to work with it or perform any additional processing
    });
  

  }
  module.exports = { summarizeList, filterList };

// PythonShell.run('summarize.py', options, (err, results) => {
//   if (err) {
//     console.error(err);
//   } else {
//     const summarizedText = results[0];
//     console.log('Summarized Text:');
//     console.log(summarizedText);
//   }
// });
