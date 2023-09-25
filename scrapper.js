const puppeteer = require('puppeteer');
require('dotenv').config();

// const { loginToGoogleChat } = require('./loginIntoGChat');

async function scrapeGoogleChat() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    executablePath: '/opt/google/chrome/chrome',
    args: [
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  })
  const page = await browser.newPage()

  const navigationPromise = page.waitForNavigation()

  await page.goto('https://chat.google.com/')

  await navigationPromise

  await page.waitForSelector('gws-button[label="Sign in to Google Workspace to access Chat"]')
  await page.click('gws-button[label="Sign in to Google Workspace to access Chat"]')

  await navigationPromise

  //TODO : change to your email 
  await page.waitForSelector('input[type="email"]');
  await page.click('input[type="email"]')
  await page.type('input[type="email"]', process.env.EMAIL)
  

  await page.waitForSelector('#identifierNext')
  await page.click('#identifierNext')
  await page.waitForTimeout(5000);

  await page.waitForSelector('input[type="password"]')
  await page.click('input[type="password"]')

  //TODO : change to your password
  await page.type('input[type="password"]', process.env.PASSWORD)

  await page.waitForSelector('#passwordNext')
  await page.click('#passwordNext')

  await page.waitForTimeout(20000);
  page.goto('https://mail.google.com/chat/u/0/#chat/space/AAAAftJCpeY')
  await navigationPromise
  await page.waitForSelector('button[aria-label="Close"]')
  await page.click('button[aria-label="Close"]')
  await page.evaluate(() => {
    window.scrollBy(0, -500); // Adjust the scroll amount as needed
  });
  const iframeHandle = await page.waitForSelector('iframe[title="Chat content"]');
  const frame = await iframeHandle.contentFrame();
  let reachedTarget = false;
  await frame.click('div[class="cK9mzf"]');  
  while (!reachedTarget) {
    await frame.focus('body');
    for(let i = 0;i<3;i++) {
      await frame.page().keyboard.press('ArrowUp')
    }
    const isTargetVisible = await frame.evaluate(() => {
      const targetElement = document.querySelector('div[class="cK9mzf"]'); // Replace with the selector of your target element
      const topElement = document.querySelector('button[aria-label="Add people & apps to this space"]');
      if (targetElement || topElement) {
        const dateString = targetElement.textContent;
        const year = 2023; // You can change this to any desired year
        const dateStringWithYear = dateString + `, ${year}`;
        const specificDate = dateString != 'Yesterday' && dateString != 'Today' ? new Date(dateStringWithYear): new Date();
        return specificDate <= new Date('Thursday, June 01' + `, ${year}`) || topElement;
      }
      return false;
    });

    if (isTargetVisible) {
      reachedTarget = true;
      console.log('Reached the target text "Mon 18 Sep".');
    }
  }
  const divText = await frame.evaluate(async () => {
    debugger
    let namesNodes = document.querySelectorAll('div[jsname="A9KrYd"]');
    let messagesNodes = document.querySelectorAll('div[class="Hj5Fxb"]');
    let title = document.title;
    let names = [];
    let messages = [];
    for(let i = 0;i< messagesNodes.length;i++) {
      const text = messagesNodes[i].firstElementChild.textContent.trim()
      const imgSrc = messagesNodes[i].getElementsByClassName('HQLhSc').length != 0? messagesNodes[i].getElementsByClassName('HQLhSc')[0].src: null;
      messages.push({text, imgSrc, name: namesNodes[i].textContent.trim()});
    }
    return messages;
  });
    
  if (divText !== null) {
    console.log('Text content of the div inside the iframe:', divText);
    const newsletterHTML = generateNewsletterHTML(divText);
  } else {
    console.log('Div element not found inside the iframe.');
  }

}


function generateNewsletterHTML(messages) {
  const fs = require('fs'); // Include the 'fs' module for file operations
  let newsletterHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Here is Throwback to last Week messages</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          h1 {
            background-color: #007BFF;
            color: #fff;
            padding: 10px;
            text-align: center;
          }
          ul {
            list-style-type: none;
            padding: 0;
          }
          li {
            background-color: #fff;
            margin: 10px;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          h2 {
            color: #007BFF;
          }
        </style>
      </head>
      <body>
        <h1>Newsletter</h1>
        <h2>From Chat Group: </h2>
        <ul>
  `;

  // Loop through the sender names and messages arrays
  for (let i = 0; i < messages.length; i++) {
    const senderName = messages[i].name.split(',')[0];
    const message = messages[i].text;
    const img = messages[i].imgSrc;

    // Add sender name and message to the HTML
    newsletterHTML += `
          <li>
            <h2>${senderName} said</h2>          
    `;
    if(message) {
      newsletterHTML += `
      <p>${message}</p>
      `
    }
    if(img) {
      newsletterHTML += `
      <img src=${img}>
      `;
    }
    newsletterHTML += `
    </li>
    `
  }
  newsletterHTML += `
        </ul>
      </body>
    </html>
  `;
  fs.writeFile('newsletter.html', newsletterHTML, (err) => {
    if (err) {
      console.error('Error writing the HTML file:', err);
    } else {
      console.log('Newsletter HTML file created successfully.');
    }
  });
  return newsletterHTML;
};

scrapeGoogleChat();

