require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');

function cookieParsing(){
    const cookies_saved = fs.readFileSync('cookies.json', 'utf8')
    return JSON.parse(cookies_saved);
}
(async () => {
    // on lance le launcher
    const browser = await puppeteer.launch(
        {
            // passer cette valeur à true plus tard
            headless:true
        }
    );

    // connexion
    const page = await browser.newPage();
    await page.goto(process.env.URL);

    await page.type('input[name="user"]', process.env.LOGIN);
    await page.type('input[name="password"]', process.env.PASSWORD);
    await page.click('button[aria-label="Login button"]', {
        button:"left",
        clickCount:1
    })

    // save les cookies de sessions dans un fichier
    const cookies = await page.cookies()
    const cookieJson = JSON.stringify(cookies)
    fs.writeFileSync('cookies.json', cookieJson)
    // ferme la page
    await page.close();

    // ouvre une nouvelle page & set les cookies de sessions
    const deserializedCookies = cookieParsing();

    // on passe dans une nouvelle page -> MEMORY CPU -> ID : 9
    const newPage = await browser.newPage();
    await newPage.goto(process.env.URL);
    await newPage.setCookie(...deserializedCookies)

    await newPage.goto(process.env.URL+process.env.LINK_PANNEL);

    await newPage.waitForSelector('.panel-container');
    const labels = await newPage.$$(".panel-container");

    var objectList = [];
    var i=0;
    for( let label of labels ) {
        const attr = await newPage.evaluate(el => el.getAttribute("aria-label"), label);
        objectList[i] = attr;
        i++;
    }
    for (i = 0; i < objectList.length; i++) {
        // on récupère la card générale
        await newPage.waitForSelector(`[aria-label="${objectList[i]}"] div.panel-title`)
        let main_element = await newPage.$(`[aria-label="${objectList[i]}"] div.panel-title`)
        //    on click sur son nom pour dropdown le menu
        await newPage.evaluate(el => {el.click()}, main_element);

        // On récupère le dropdown
        await newPage.waitForSelector(`[aria-label="Panel header item Data"]`)
        let on_dropdown_element = await newPage.$(`[aria-label="Panel header item Data"]`)
        // on click sur le menu d'accès aux datas
        await newPage.evaluate(el => {el.parentElement.click()}, on_dropdown_element);

        // on récupère le boutton de download
        await newPage.waitForSelector(`[aria-label="Panel inspector Data content"] div button span`)
        let on_button_element = await newPage.$(`[aria-label="Panel inspector Data content"] div button span`)
        // on click dessus
        await newPage.evaluate(el => {el.click()}, on_button_element);

        // on récupère le drawer [ l'élément sur le coté du menu ]
        await newPage.waitForSelector(`div.drawer-mask`)
        let on_left_element = await newPage.$(`div.drawer-mask`)
        // on click dessus
        await newPage.evaluate(el => {el.click()}, on_left_element);
    }

    // await browser.close();
})();
