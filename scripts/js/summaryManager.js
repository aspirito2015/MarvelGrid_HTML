import { getCategoryIDs, getSummaryBools } from "./gameManager.js";
import { getIntersectionCount } from "./sheetsImporter.js";

main();

function main() {
    document.getElementById("giveup").addEventListener("click", function () {
        summary_on();
    });
    document.getElementById("x-btn").addEventListener("click", function () {
        summary_off();
    });
    document.getElementById("copy-sum").addEventListener("click", function () {
        copy_sum();
    });
    fillSummaryPanel();
}

export function summary_on() {
    document.getElementById("overlay").style.display = "block";
    document.getElementById("sum").style.display = "";
    document.body.classList.add('noscroll');
}

export function summary_off() {
    document.getElementById("overlay").style.display = "none";
    document.getElementById("sum").style.display = "none";
    document.body.classList.remove('noscroll');
}

async function fillSummaryPanel() {
    let answerGrid = document.getElementById("answer-grid");
    let intersection_tags = answerGrid.getElementsByClassName("ans-num");
    let hyperlink_tags = answerGrid.getElementsByTagName("a");
    // console.log(hyperlink_tags);
    let category_ids = getCategoryIDs();
    // console.log(category_ids);
    for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
            let cat_1 = category_ids[x];
            let cat_2 = category_ids[y+3];
            let n = await getIntersectionCount(cat_1, cat_2);
            let index = x + 3 * y;
            // console.log(`${index}, (${x}, ${y+3}): ${cat_1} ∩ ${cat_2} = ${n}`);
            let url = `answers.html?category1=${cat_1}&category2=${cat_2}`;
            hyperlink_tags[index].href = url;
            intersection_tags[index].innerHTML = n;
        }
    }
    console.log("finished filling summary panel");
}

function copy_sum() {
    let txt = "";
    let count = 0;
    let sum_bools = getSummaryBools();
    for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
            if (sum_bools[x + 3 * y]) {
                // Green Square: 🟩 Dec: &#129001	Hex: &#x1F7E9
                txt += "&#129001";
                count++;
            } else {
                // White Square: ⬜ Dec: &#11036    Hex:	&#x2B1C
                txt += "&#11036";
            }
        }
        txt += "\n";
    }
    txt = "Immaculate Inning 999 " + count + "/9:\nRarity: 999\n" + txt + "Play at https://aspirito2015.github.io/MarvelGrid_HTML/";
    let copy_tmp = document.getElementById("copy-tmp");
    copy_tmp.innerHTML = txt;
    navigator.clipboard.writeText(copy_tmp.innerHTML);
    console.log("Copied to clipboard");
}
