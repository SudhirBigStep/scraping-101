const express = require("express");
const puppeteer = require('puppeteer');
const router = express.Router();
const { filterList, summarizeList } = require('./text-summary');

app.post('/scrape', startExecution, filterList, summarizeList);

async function startExecution(req, res, next) {
  const {email, password, space_url, months} = req.body
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Your Puppeteer script here...
    // Ensure that you execute the script and store the result in a variable, e.g., divTexts

    const divTexts = await executePuppeteerScript(page, email, password,space_url,months);
    req.inputList = divTexts;
    next();
    // filterList(divTexts)
    // Send the response
    // res.json({ success: true, data: divTexts });

    await browser.close();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}


async function executePuppeteerScript(page, email, password, space_url,months) {
  // Your Puppeteer script here...
  // Make sure to return the result from your script, e.g., divTexts

  const navigationPromise = page.waitForNavigation();

  await page.goto('https://accounts.google.com/ServiceLogin?continue=https://chat.google.com/?referrer=2', { waitUntil: 'domcontentloaded' });

  await navigationPromise

  await page.type('input[type="email"]', email);
  await page.waitForSelector('#identifierNext')
  await page.click('#identifierNext');

  await navigationPromise

  await page.waitForSelector('input[type="password"]');
  await page.click('input[type="password"]')
  await page.type('input[type="password"]', password);

  await page.waitForSelector('#passwordNext')
  await page.click('#passwordNext')  

  await page.setDefaultTimeout(30000);
  await page.waitForTimeout(20000)

  page.goto(space_url)

  await navigationPromise

  await page.evaluate(() => {
    window.scrollBy(0, -500); // Adjust the scroll amount as needed (from sudhir)
  });

  const iframeHandle = await page.waitForSelector('iframe[title="Chat content"]');
  const frame = await iframeHandle.contentFrame();

  // const divTexts = await frame.evaluate(() => {
  //   const divs = document.querySelectorAll('div[jsname="bgckF"]');
  //   return Array.from(divs).map((div) => div.textContent.trim());
  // });

  // return divTexts;

  let reachedTarget = false;                      // from sudhir
  await frame.click('div[class="cK9mzf"]');  
  while (!reachedTarget) {
    await frame.focus('body');
    for(let i = 0;i<3;i++) {
      await frame.page().keyboard.press('ArrowUp')
    }
    const isTargetVisible = await frame.evaluate((months) => {
      let date = new Date();
      date = date.setMonth(date.getMonth-parseInt(months,10));
      const targetElement = document.querySelector('div[class="cK9mzf"]'); // Replace with the selector of your target element
      const topElement = document.querySelector('button[aria-label="Add people & apps to this space"]');
      if (targetElement || topElement) {
        const dateString = targetElement.textContent;
        const year = 2023; // You can change this to any desired year
        const dateStringWithYear = dateString + `, ${year}`;
        const specificDate = dateString != 'Yesterday' && dateString != 'Today' ? new Date(dateStringWithYear): new Date();
        return specificDate <= date.setMonth(date.getMonth()-parseInt(months,10)) || topElement;
      }
      return false;
    }, months);

    if (isTargetVisible) {
      reachedTarget = true;
      console.log('Reached the target text "Mon 18 Sep".');
    }
  }
  let title = await page.title();
  const divText = await frame.evaluate(async (title) => {
    // debugger
    let namesNodes = document.querySelectorAll('div[jsname="A9KrYd"]');
    let messagesNodes = document.querySelectorAll('div[class="Hj5Fxb"]');
    let messages = [];
    for(let i = 0;i< messagesNodes.length;i++) {
      const text = messagesNodes[i].firstElementChild.textContent.trim()
      const imgSrc = messagesNodes[i].getElementsByClassName('HQLhSc').length != 0? messagesNodes[i].getElementsByClassName('HQLhSc')[0].src: null;
      messages.push({text, title, imgSrc, name: namesNodes[i].textContent.trim()});
    }
    return messages;
  }, title);
    
  if (divText !== null) {
    console.log('Text content of the div inside the iframe:', divText);
    // const newsletterHTML = generateNewsletterHTML(divText);
  } else {
    console.log('Div element not found inside the iframe.');
  }

  return divText
}

module.exports = router;