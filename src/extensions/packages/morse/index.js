let ITU = {
    // letters
    "a" :  ".-",
    "b" :  "-...",
    "c" :  "-.-.",
    "d" :  "-..",
    "e" :  ".",
    "f" :  "..-.",
    "g" :  "--.",
    "h" :  "....",
    "i" :  "..",
    "j" :  ".---",
    "k" :  "-.-",
    "l" :  ".-..",
    "m" :  "--",
    "n" :  "-.",
    "o" :  "---",
    "p" :  ".--.",
    "q" :  "--.-",
    "r" :  ".-.",
    "s" :  "...",
    "t" :  "-",
    "u" :  "..-",
    "v" :  "...-",
    "w" :  ".--",
    "x" :  "-..-",
    "y" :  "-.--",
    "z" :  "--..",
    // numbers
    "1" :  ".----",
    "2" :  "..---",
    "3" :  "...--",
    "4" :  "....-",
    "5" :  ".....",
    "6" :  "-....",
    "7" :  "--...",
    "8" :  "---..",
    "9" :  "----.",
    "0" :  "-----",
    // punctuation
    "." :  ".-.-.-",
    "," :  "--..--",
    "?" :  "..--..",
    "\'": ".----.",
    "!" :  "-.-.--",
    "/" :  "-..-.",
    "(" :  "-.--.",
    ")" :  "-.--.-",
    "&" :  ".-...",
    ":" :  "---...",
    ";" :  "-.-.-.",
    "=" :  "-...-",
    "+" :  ".-.-.",
    "-" :  "-....-",
    "_" :  "..--.-",
    "\"": ".-..-.",
    "$" :  "...-..-",
    "@" :  ".--.-.",
    " " :  "/"
}, 
    chars = {
    // letters
    ".-"  : "a",
    "-...": "b",
    "-.-.": "c",
    "-.." : "d",
    "."   : "e",
    "..-.": "f",
    "--." : "g",
    "....": "h",
    ".."  : "i",
    ".---": "j",
    "-.-" : "k",
    ".-..": "l",
    "--"  : "m",
    "-."  : "n",
    "---" : "o",
    ".--.": "p",
    "--.-": "q",
    ".-." : "r",
    "..." : "s",
    "-"   : "t",
    "..-" : "u",
    "...-": "v",
    ".--" : "w",
    "-..-": "x",
    "-.--": "y",
    "--..": "z",
    // numbers
    ".----": "1",
    "..---": "2",
    "...--": "3",
    "....-": "4",
    ".....": "5",
    "-....": "6",
    "--...": "7",
    "---..": "8",
    "----.": "9",
    "-----": "0",
    // punctuation
    ".-.-.-" : ".",
    "--..--" : ",",
    "..--.." : "?",
    ".----." : "\'",
    "-.-.--" : "!",
    "-..-."  : "/",
    "-.--."  : "(",
    "-.--.-" : ")",
    ".-..."  : "&",
    "---..." : ":",
    "-.-.-." : ";",
    "-...-"  : "=",
    ".-.-."  : "+",
    "-....-" : "-",
    "..--.-" : "_",
    ".-..-." : "\"",
    "...-..-": "$",
    ".--.-." : "@",
    //" "      : "",
    "/"      : " "
}, 
    info = {
    version: "0.0.2",

    encode: function(str) {
        var encoding = "";

        for (var i=0; i<str.length; i++) {
            var char = str.charAt(i).toLowerCase();
            if (ITU[char]) {
                encoding += ITU[char];
                encoding += " ";
            }
        }
        return encoding;
    },

    decode: function(str) {
        var decoding = "";
        var words = str.split("/");

        // each word
        for (var i=0; i<words.length; i++) {
            // each character
            var character = words[i].split(" ");
            for (var j=0; j<character.length; j++) {
                if (chars[character[j]])
                    decoding += chars[character[j]];
            }
            decoding += " ";
        }
        return decoding;
    },

    isValid: function(str, type) { // type = chars, morse
        if (!str)
            return null;

        if (type != "chars" && type != "morse")
            return null;

        if (type == "chars") {
            for (var i=0; i<str.length; i++) {
                if (!ITU[str.charAt(i).toLowerCase()])
                    return false;
            }
            return true;
        }
        else if (type == "morse") {
            var words = str.split("/");
            // each word
            for (var i=0; i<words.length; i++) {
                // each character
                var character = words[i].split(" ");
                for (var j=0; j<character.length; j++) {
                    if (!chars[character[j]] && character[j] != '') // ignore spaces
                        return false;
                }
            }
            return true;
        }
    }

};
module.exports = (str) => {
    if(info.isValid(str, "morse")){
        return {
            name: "📤 Decoded 📤",
            text: info.decode(str)
        }
    }else{
        return {
            name: "📤 Encoded 📤",
            text: info.encode(str)
        }
    }
};

