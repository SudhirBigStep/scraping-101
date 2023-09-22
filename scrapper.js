const puppeteer = require('puppeteer');
const { loginToGoogleChat } = require('./loginIntoGChat');

async function scrapeGoogleChat() {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null, executablePath: '/opt/google/chrome/chrome'})
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
  await page.type('input[type="email"]', '*')
  

  await page.waitForSelector('#identifierNext')
  await page.click('#identifierNext')
  await page.waitForTimeout(3000);

  await page.waitForSelector('input[type="password"]')
  await page.click('input[type="password"]')

  //TODO : change to your password
  await page.type('input[type="password"]', '*')

  await page.waitForSelector('#passwordNext')
  await page.click('#passwordNext')  
  // await page.waitForSelector('div[data-challengeid="3"]');
  // await page.click('div[data-challengeid="3"]')

  // await page.waitForSelector('input[type="tel"]')
  // await page.click('input[type="tel"]')

  // //TODO : change to your password
  // await page.type('input[type="tel"]', '')
  await page.waitForTimeout(40000);
  page.goto('https://mail.google.com/chat/u/0/#chat/space/AAAAKLD2ppk')
  await page.waitForNavigation();

    // Extract chat messages
    const messages = await page.evaluate(() => {
      const messageElements = Array.from(document.querySelectorAll('div.message'));
      return messageElements.map((element) => {
        const sender = element.querySelector('div.message-sender').textContent;
        const timestamp = element.querySelector('div.message-timestamp').textContent;
        const content = element.querySelector('div.message-content').textContent;
        return { sender, timestamp, content };
      });
    });

    const newsletterHTML = generateNewsletterHTML(messages);

  //await browser.close()
  // await browser.close();
}


function generateNewsletterHTML(messages) {
  // Generate HTML code for the newsletter
  // You can use a template library like Handlebars.js or build the HTML manually

  let newsletterHTML = '<html><head><title>Google Chat Newsletter</title></head><body>';

  messages.forEach((message) => {
    newsletterHTML += `<p><strong>${message.sender}</strong> - ${message.timestamp}</p>`;
    newsletterHTML += `<p>${message.content}</p>`;
  });

  newsletterHTML += '</body></html>';

  return newsletterHTML;
}

scrapeGoogleChat();

