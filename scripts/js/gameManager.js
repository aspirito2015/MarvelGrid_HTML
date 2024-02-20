var btn_tags = document.getElementsByName("btn");
var btn_active_tag;
var btn_active_x;
var btn_active_y;
var guessesLeft = 9;
var bad_guess_grid = [[], [], [], [], [], [], [], [], []];
var used_chars = [];
var summary_bools = Array(9).fill(false);
var characters = {};
var gameScore = 0;
var cat_ids = [119, 66, 24, 95, 51, 12];
// cat_ids = [143, 136, 23, 135, 144, 143];
// cat_ids = [85, 60, 104, 51, 76, 140];
// cat_ids = [67, 38, 30, 135, 138, 65];
// cat_ids = [92, 37, 39, 17, 38, 28]; // longest names
// cat_ids = [97, 99, 46, 11, 24, 45]; // 2nd longest names
// cat_ids = [49, 140, 2, 6, 3, 4]; // 3rd longest names
// cat_ids = [83,137,66,91,86,51];
// cat_ids = [19,57,78,135,93,66];
// cat_ids = [133,142,63,24,60,70];
// cat_ids = [135, 20, 51, 142, 106, 93];
// cat_ids = [18, 12, 84, 83, 139, 50];
// cat_ids = [49, 63, 59, 76, 32, 94];
// cat_ids = [106, 26, 37, 95, 135, 140]; // GOOD ['easy', 'easiest', 'easy', 'easiest', 'medium', 'easy', 'medium', 'easy', 'hardest']
// cat_ids = [73, 136, 59, 63, 135, 133]; // ['easiest', 'easy', 'easy', 'medium', 'hardest', 'easiest', 'easiest', 'medium', 'easiest']

main();

async function main() {
    updateGuesses(guessesLeft);
    document.getElementById("giveup").addEventListener("click", function () {
        updateGuesses(0);
    });
}

export function getSummaryBools() { return summary_bools; }

export function getCategoryIDs() { return cat_ids; }

export function getActiveCellCoords() { return [btn_active_x, btn_active_y]; }

export function getActiveCellIndex() { return btn_active_x + 3 * btn_active_y; }

export function setActiveCell(x, y) {
    console.log(`active cell set to ${x}, ${y}`);
    btn_active_x = x;
    btn_active_y = y;
    btn_active_tag = btn_tags[x + 3 * y];
    btn_active_tag.classList.add("highlighted");
}

export function clearActiveCell() {
    console.log('active cell cleared');
    btn_active_x = null;
    btn_active_y = null;
    if (btn_active_tag == null) return;
    btn_active_tag.classList.remove("highlighted");
    btn_active_tag = null;
}

export async function fillActiveCell(characterID) {
    // increase score
    let charScore = Math.round(await getAnswerScore(characterID));
    gameScore += charScore;
    // add characterID to list of used characters
    used_chars.push(characterID);
    // update the html component(s)
    btn_active_tag.setAttribute("style", "background-color: #59d185;");
    let q = `SELECT charID, name, href, image, alias FROM characters WHERE charID=${characterID}`;
    let result = await sqliter.query_sqlite(q);
    let characterData = result[0];
    let name_to_display = characterData.name;
    let pattern = /\..*\.$/;
    if (pattern.test(characterData.alias)) {
        name_to_display = characterData.alias;
    }
    let image_to_display = "https://upload.wikimedia.org/wikipedia/en/archive/b/b1/20210811082420%21Portrait_placeholder.png";
    if (characterData.image) { image_to_display = characterData.image; }
    btn_active_tag.innerHTML = `<img src="${image_to_display}" 
        class="grid-content" style="width: 90%; height: 100%; 
        object-fit: cover;"><div class="grid-percent">${charScore} pts</div>
        <div class="grid-label">${name_to_display}</div>`;
    // update summary
    let index = getActiveCellIndex();
    let summaryCells = document.getElementsByClassName("sum-grid-cell");
    summaryCells[index].setAttribute("style", "background-color: #59d185;");
    summary_bools[index] = true;
    // replace event listener on grid button with one that opens link to wiki
    let new_btn_active = removeAllEventListeners(btn_active_tag);
    new_btn_active.addEventListener('click', function () {
        let url = `https://marvel.fandom.com${characterData.href}`;
        window.open(url, '_blank').focus();
    });
}

// Function to remove all event listeners from an element
function removeAllEventListeners(element) {
    let clone = element.cloneNode(true);
    element.parentNode.replaceChild(clone, element);
    return clone;
}



export function getBadGuesses(x, y) {
    if (arguments.length == 0) {
        x = btn_active_x;
        y = btn_active_y;
    }
    var bad_guesses = bad_guess_grid[x + 3 * y];
    if (bad_guesses === undefined) return null;
    return bad_guesses;
}

export function addBadGuess(characterID, x, y) {
    if (arguments.length < 3) {
        x = btn_active_x;
        y = btn_active_y;
    }
    let index = x + 3 * y;
    bad_guess_grid[index].push(characterID);
}



export function getUsedCharTags() { return used_chars; }

export async function getCharacters() {
    if (characters.length === undefined || characters.length < 1) {
        let q = `SELECT charID, name, alias FROM characters`;
        characters = await sqliter.query_sqlite(q);
    }
    return characters;
}

export async function isCharacterValid(characterID) {
    var cat_id_x = cat_ids[btn_active_x];
    var cat_id_y = cat_ids[3 + btn_active_y];
    var query = `SELECT edgeID, catID FROM edges WHERE charID=${characterID} 
        AND catID IN (${cat_id_x}, ${cat_id_y})`;
    let response = await sqliter.query_sqlite(query);
    let length = response.length;
    var valid = length >= 2;
    console.log(`${characterID} valid? ${valid}`);
    return valid;
}

export async function getAnswerScore(characterID) {
    var catID_x = cat_ids[btn_active_x];
    var catID_y = cat_ids[3 + btn_active_y];
    var query = `SELECT charID, appearances FROM characters
        WHERE  charid IN (SELECT charid
            FROM   edges
            WHERE  catid = ${catID_x}
            INTERSECT
            SELECT charid
            FROM   edges
            WHERE  catid = ${catID_y})
        ORDER BY appearances DESC;`;
    let response = await sqliter.query_sqlite(query);
    let maxA = response[0].appearances;
    let minA = response[response.length - 1].appearances;
    console.log(response);
    let charAppearances = -1;
    for (let i = 0; i < response.length; i++) {
        if (response[i].charID == characterID) {
            charAppearances = response[i].appearances;
        }
    }
    if (charAppearances < 0) {
        console.log("Something went wrong. Could not find selected character's appearances.");
        return maxA;
    }
    let maxP = 50;
    let minP = 10;
    // let pointsMod = ;
    let power = 2;
    // let points = (maxP - minP) * (1 - Math.pow((Math.log(charAppearances)-Math.log(minA))/(Math.log(maxA)-Math.log(minA)), power)) + minP;
    let points = minP + (-minP + maxP) * Math.pow((Math.log(maxA/charAppearances)/Math.log(maxA/minA)), power);
    if (isNaN(points)) points = maxP;
    console.log(`
        max appearances: ${maxA}
        min points: ${minP}
        max points: ${maxP}
        appearances: ${charAppearances}
        power: ${power}
        points: ${points}
    `);
    // console.log(points);
    return points;
}


export function decrementGuesses() {
    updateGuesses(guesses - 1);
}

function updateGuesses(i) {
    guesses = i;
    let guessdiv = document.getElementById("guesses");
    animate_guesses(guessdiv, 0, guesses, 300);
    if (guesses <= 0) lose();
}

function animate_guesses(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function lose() {
    let giveup_button = document.getElementById("giveup");
    giveup_button.innerHTML = "Show Summary";
    giveup_button.click();
    for (let i = 0; i < btn_tags.length; i++) {
        btn_tags[i].classList.remove("grid-item");
        btn_tags[i].classList.add("grid-item-no-hover");
    }
}
