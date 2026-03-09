const puppeteer = require('puppeteer');
const fs = require('fs');
const readline = require('readline');


// MY CODE GETS AS FAR AS LOGGING IN, WITH A SEMI SYNCHRONOUS STEP IN ORDER TO COMPLETE 2FA ON MY PHONE
// AFTER LOGGING IN, IT STARS THE  REPOS
// THEN I RUN INTO THE ISSUE THAT I CANNOT SELECT THE CREATE LIST BUTTON
// HANNUM TOLD ME IT WAS NOT TO BE THIS TEDIOUS AND TO JUST TURN IN WHAT I HAVE AS IS

//sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//comment added
// CLI prompt helper
function ask(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

const credentials = JSON.parse(fs.readFileSync('credentials.json'));

(async () => {

    const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/usr/bin/chromium',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: null
    });

    const page = await browser.newPage();

    console.log("Opening GitHub login...");
    await page.goto('https://github.com/login', { waitUntil: 'networkidle2' });

    // Type username & password
    await page.type('#login_field', credentials.username);
    await page.type('#password', credentials.password);

    // Submit login form
    await page.click('input[type="submit"]');

    await sleep(5000); // wait for potential 2FA page to load
    await page.screenshot({ path: 'loggy.png' });
    console.log("Login submitted. Complete 2FA on your phone...");

    // Wait for the page to finish navigating after 2FA
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log("Logged in successfully!");



    const repositories = [
        "cheeriojs/cheerio",
        "axios/axios",
        "puppeteer/puppeteer"
    ];

    // STAR REPOS
    for (const repo of repositories) {

        console.log("Opening repo:", repo);

        await page.goto(`https://github.com/${repo}`, { waitUntil: 'networkidle2' });

        await sleep(2000);

        try {

            const starSelector = 'button[aria-label^="Star this repository"]';

            await page.waitForSelector(starSelector, { timeout: 5000 });

            await page.click(starSelector);

            console.log("Starred", repo);

        } catch (err) {

            console.log("Could not star", repo, "(maybe already starred)");

        }

        await sleep(2000);
    }

    const starsUrl = `https://github.com/willruskin?tab=stars`;
    console.log("Opening starred repositories page...");
    await page.goto(starsUrl, { waitUntil: "networkidle2" });
    console.log("Current URL: ", page.url());
    await page.screenshot({ path: 'example.png' });
    // EVERYTHING WORKS TILL RIGHT HERE


    
    
    
    
    
    
    
    // BELOW IS WHERE IT BREAKS, I CANNOT SELECT THE CREATE LIST BUTTON, EVEN THOUGH IT APPEARS IN THE SCREENSHOT
    // PRETTY MUCH TRIED EVERY SELECTOR AND THIS PIECE OF CODE BELOW WAS GIVEN TO ME BY HANNUM, BUT IT STILL DOES NOT WORK


    // Step 1: Click the "New list" button to open the modal
    const newListButtons = await page.$$('.Button--primary.Button--medium.Button');
    for (const button of newListButtons) {
        const text = await button.evaluate(node => node.textContent.trim());
        if (text === 'Create') {
            await button.click();
            break;
        }
    }


    // Step 2: Wait for modal input to appear
    // await page.waitForSelector('#dialog-81d054a5-3b03-46d7-bbe6-4c07fa715d7b > scrollable-region > div > form', { timeout: 5000 });

    // // Step 3: Type the list name
    // const inputs = await page.$$('text-expander input');
    // for (const input of inputs) {
    //     const placeholder = await input.evaluate(node => node.getAttribute('placeholder'));
    //     if (placeholder === '⭐️ Name this list') {
    //         await input.type('Starred Repos');
    //         break;
    //     }
    // }

    // // Step 4: Click the "Create" button inside the modal
    // // Wait for buttons inside modal to appear (sometimes they render after typing)
    // await page.waitForTimeout(500); // small delay to ensure button is ready

    // const modalButtons = await page.$$('.Button--primary.Button--medium.Button');
    // for (const button of modalButtons) {
    //     const text = await button.evaluate(node => node.textContent.trim());
    //     if (text === 'Create') {
    //         await button.click();
    //         break;
    //     }
    // }


    // // End of automation
    // console.log("Automation finished");
    await browser.close();

})();