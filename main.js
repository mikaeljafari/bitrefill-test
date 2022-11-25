/*

  CHALLENGE:
  
  FORK this Pen. 

  Finish the "mustachify" function so that the console output should be something like:
  { duration: X,
    result: "A:Alpha, Y:xY, B:xB1 and xB2, Z:xZ C:xC1, xC2, xF1 and xF2 D:Delta."
    answeredCorrectly: true }

  When you're done, send in this CodePen to continue the process.

  You'll be evaluated on code quality and performance

*/

async function getData(key) {
    switch (key) {
        case 'A': return 'Alpha';
        case 'BB': return '{{B1}} and {{B2}}';
        case 'C': return '{{C1}}, {{C2}}, {{EE}}';
        case 'DD': return 'Delta';
        case 'EE': return '{{F1}} and {{F2}}';
    }
    await new Promise(r => { setTimeout(r, 1000); });
    return `x${key}`;
}

function hasShieldedValue(input) {
    let regExp = /\{{2}\w+\}{2}/g;
    return regExp.test(input);
}

function getValueFromPair(input) {
    let regExp = /\{{2}\w+\}{2}/;
    return input.match(regExp);
}

function unshieldValue(input) {
    let regExp = /(?<=\{\{)\w+(?=\}\})/;
    return input.match(regExp).toString();
}

function splitInclusiveShieldedValues(input) {
    let regExp = /(\{{2}\w+\}{2})/g;
    return input.split(regExp).filter(e => e != "");
}

function splitIntoKeyValuePairs(input) {
    let regExp = /\w+:\{{2}\w+\}{2}/g;
    return input.match(regExp);
}

function getKeyFromPair(input) {
    let regExp = /\w+(?=:\{{2}\w+\}{2})/g;
    return input.match(regExp);
}

async function mustachify(input, callback) {
    let mustSubs = [];

    //Split input string into either single or multiple token lists depending on if they are comma separated. 
    let subInputs = input.split(",");
    for (let i = 0; i < subInputs.length; i++) {
        //Start work on each sublist of input.
        mustSubs[i] = mustachifySubList(subInputs[i], callback);
    }

    let result = "";
    let awaitedSubs = await Promise.all(mustSubs);

    //Puzzle together the sublists into the final string.
    for (let i = 0; i < awaitedSubs.length; i++) {
        if (i == awaitedSubs.length - 1) {
            result += awaitedSubs[i] + ".";
        } else {
            result += awaitedSubs[i] + ", ";
        }
    }
    return result;
}



async function mustachifySubList(input, callback) {
    //Holder for all keys. Example: A
    let keys = [];
    //Holder for all values. Example: Alpha
    let values = [];

    //Split input into pairs. Example: A:{{A}}
    let splitInputPairs = splitIntoKeyValuePairs(input);

    for (let i = 0; i < splitInputPairs.length; i++) {
        let pair = splitInputPairs[i];
        let key = getKeyFromPair(pair);
        let value = getValueFromPair(pair).toString();
        keys[i] = key;
        let partAnswer = mustSubHelper(value, callback);
        values[i] = partAnswer;
    }
    let res = "";
    let awaitedVals = await Promise.all(values);

    //Puzzle together keys and values.
    //How to do it depends on if key-value pairs were separated by a comma or not.
    if (awaitedVals.length == 1) {
        for (let i = 0; i < awaitedVals.length; i++) {
            res += keys[i] + ":" + awaitedVals[i];
        }
    } else {
        for (let i = 0; i < awaitedVals.length; i++) {
            if (i == awaitedVals.length - 1) {
                res += keys[i] + ":" + awaitedVals[i];
            } else {
                res += keys[i] + ":" + awaitedVals[i] + " ";
            }
        }
    }
    return res;
}

async function mustSubHelper(input, callback) {
    let splitInput = [];

    //If there is a value to get data from.
    if (hasShieldedValue(input)) {
        splitInput = splitInclusiveShieldedValues(input);

        //Find that value and get the data.
        for (let i = 0; i < splitInput.length; i++) {
            if (hasShieldedValue(splitInput[i])) {
                splitInput[i] = callback(unshieldValue(splitInput[i]));
            }
        }
    } else {
        return input;
    }

    let awaitedAnswers = await Promise.all(splitInput);

    //Check if accquired data contains new key to get data from.
    for (let i = 0; i < awaitedAnswers.length; i++) {
        let awaitedElement = awaitedAnswers[i];
        if (hasShieldedValue(awaitedElement)) {
            let split = splitInclusiveShieldedValues(awaitedElement);

            for (let j = 0; j < split.length; j++) {
                let splitElement = split[j];

                if (hasShieldedValue(splitElement)) {
                    split[j] = mustSubHelper(splitElement, callback);
                }
            }

            split = await Promise.all(split);
            awaitedAnswers[i] = split.join("");
        }
    }
    return awaitedAnswers;
}

async function run() {

    let startTime = Date.now();
    let result = await mustachify(`A:{{A}}, Y:{{Y}}, B:{{BB}}, Z:{{Z}} C:{{C}} D:{{DD}}.`, getData);
    let answeredCorrectly = (result === 'A:Alpha, Y:xY, B:xB1 and xB2, Z:xZ C:xC1, xC2, xF1 and xF2 D:Delta.');
    let duration = Date.now() - startTime;

    console.log({ duration, result, answeredCorrectly });
}

run();