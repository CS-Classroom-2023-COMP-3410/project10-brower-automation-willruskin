const puppeteer = require('puppeteer');
const fs = require('fs');
const readline = require('readline');

//sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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

    await page.type('#login_field', credentials.username);
    await page.type('#password', credentials.password);

    await Promise.all([
        page.click('input[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    let currentUrl = page.url();
    console.log("Current URL:", currentUrl);

    // Check if GitHub requires 2FA
    const otpInput = await page.$('input[name="otp"]');

    if (otpInput) {

        console.log("GitHub 2FA verification required.");

        const code = await ask("Paste GitHub email verification code: ");

        await page.type('input[name="otp"]', code);

        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.click('button[type="submit"]')
        ]);

        console.log("2FA verification successful.");
    }

    console.log("Logged into GitHub as:", credentials.username);

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

    // Go to stars page
    const starsUrl = `https://github.com/willruskin?tab=stars`;
    console.log("Opening starred repositories page...");
    await page.goto(starsUrl, { waitUntil: "networkidle2" });
    console.log("Current URL: ", page.url());

    // Click "Create list"
    const listName = `My Starred Repos`;

    // Wait for the button that opens the dialog
    await page.waitForSelector('button[data-show-dialog-id]', { visible: true });

    // Click the Create list button
    await page.click('button[data-show-dialog-id]');

    // small delay to let modal open
    await sleep(1000);

    // Wait for the input field to appear and be interactable
    /* 
    
    
    THIS IS WHERE IT FAILS AT


    */


    await page.waitForSelector('#user_list_name', { visible: true });

    // Fill in the list name
    await page.type('#user_list_name', listName);

    // Wait a tiny bit before clicking "Create"
    await sleep(500);

    // Click the "Create" button inside the modal
    const createSubmitBtn = await page.$('.js-user-list-form button[type="submit"]');
    await createSubmitBtn.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await createSubmitBtn.click();

    // Wait for a confirmation element (the modal disappears or a new list appears)
    await page.waitForSelector('.js-user-list-form', { hidden: true, timeout: 5000 });

    console.log("List created:", listName);

    // End of automation
    console.log("Automation finished");
    await browser.close();

})();