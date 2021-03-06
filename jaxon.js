/*

    JAXON is an array based preset manager for extendscript
    It loads and saves presets to the user data-folder in JSON format
    
    It assumes your presets are objects collected in an array
    You can either use #include or just copy/paste this script
    
    NOTE: At the moment this manager does not validate anything

    Bruno Herfst 2016

    Version 0.1
    
    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

*/

var jaxon = function(filePath, standardPresets, templatePreset, presetLockChar){

    // ref to self
    var self = this;

    self._clone = function( something ) {
        //clones whatever it is given via JSON conversion
        return self.JSON.parse(self.JSON.stringify( something ));
    }

    self._not_in_array = function(arr, element) {
        for(var i=0; i<arr.length; i++) {
            if (arr[i] == element) return false;
        }
        return true;
    }

    self._fileExist = function(filePath) {
        var f = File(filePath);
        if(f.exists){
            return true;
        } else {
            return false;
        }
    }

    self._writeFile = function(filePath, contentString) {
        var f = File(filePath);
        try{
            if( !f.open('w') ){
                alert("Error opening file at " + filePath +" \n "+ f.error);
            }
            if( !f.write( String(contentString) ) ){
                alert("Error writing to file at " + filePath +" \n "+ f.error);
            }
            if( !f.close() ){
                alert("Error closing file at " + filePath +" \n "+ f.error);
            }
            return f;
        } catch (t) {
            alert("Error writing to file at " + filePath +" \n "+ t.error);
        }
        
        f.close();
        return false;
    }

    self._updatePreset = function(OldPreset, NewPreset, ignoreKeys){
        // This function will try and copy the old presets
        for (var key in NewPreset) {
            if(OldPreset.hasOwnProperty(key)){
                if ( self._not_in_array(ignoreKeys, key) ){
                    NewPreset[key] = OldPreset[key];
                }
            }
        }
        return NewPreset;
    }

    self._savePresets = function(filePath, obj){
        var objStr   = self.JSON.stringify(obj);
        if( self._writeFile(filePath, objStr) ) {
            return true;
        } else {
            alert("Could not write to file " + filePath);
            return false;
        }
    }

    self._loadPresets = function(filePath){

        if(!self._fileExist(filePath)){
            alert("Cannot load presets.\nFile does not exist.");
            return false;
        }

        var fSettings = File(filePath);
        fSettings.open('r');
        var content = fSettings.read();
        fSettings.close();

        try {
            var presets = self.JSON.parse(content);
        } catch(e) {
            alert("Error reading JSON\n" + e.description);
            var presets = self.presets;
        }

        for (var p in presets) {
            presets[p] = self.updatePreset(presets[p], []);
        }

        self.presets = presets;
        return self.presets;
    }
    
    //  standardPresets, templatePreset,

    // ref to JSON
    self.JSON     = JSON;
    // standard file path
    self.filePath = filePath;
    // standard file
    self.file     = File(self.filePath);
    // current preset (The presets we manipulate)
    self.presets  = self._clone(standardPresets);
    // A template preset (For validation and return)
    self.template = self._clone(templatePreset);
    // preset locking character
    // any preset starting with this character cannot be changed by the user
    // users cannot start a preset with this character
    self.lockChar = presetLockChar || '-';


    //-------------------------------------------------
    // S T A R T   P U B L I C   A P I
    //-------------------------------------------------
    
    self.getPresets = function(){
        // return a copy of all presets
        return self._clone(self.presets);
    }

    self.getPreset = function(key, val) {
        // Sample usage: Jaxon.getPreset('id',3);
        for (var i = 0; i < self.presets.length; i++) {
            for (var thisKey in self.presets[i]) {
                if (thisKey == key) {
                    if(self.presets[i][key] == val) {
                        return self.presets[i];
                    }
                    continue;
                }
            }
        }

        return null;
    }
    
    self.addPreset = function(obj) {
        // Add optional before/after key?
        self.presets.push(obj);
        if( self._savePresets(self.filePath, self.presets) ) {
            return true;
        } else {
            alert("Could not save presets to " + self.filePath);
            return false;
        }
    }

    self.addUniquePreset = function(obj, key, val) {
        // Sample usage: Jaxon.addUniquePreset(obj, 'name', "My New Preset");
        var exist = self.getPreset(key, val);
        if(exist){
            var a = confirm("Do you want to overwrite the existing preset?");
            if (a == true) {
                self.removePresets(key, val);
            } else {
                return false;
            }
        }
        return self.addPreset(obj);
    }
    
    self.updatePreset = function(obj, ignoreKeys) {
        var ignoreKeys = ignoreKeys || [];
        if(! ignoreKeys instanceof Array) {
            throw "The function updatePreset expects ignoreKeys be type of array."
        }
        // Create a copy of the standard preset
        var newPreset  = self._clone(self.template);
        return self._updatePreset(obj, newPreset, ignoreKeys);
    }
    
    self.removePresets = function(key, val) {
        // Sample usage: Jaxon.removePresets('id',3);
        var removedPresets = false;
        var len = self.presets.length-1;
        for (var i = len; i >= 0; i--) {
            for (var thisKey in self.presets[i]) {
                if (thisKey == key) {
                    if(self.presets[i][key] == val) {
                        self.presets.splice( i, 1 );
                        removedPresets = true;
                    }
                    continue;
                }
            }
        }
        if(removedPresets){
            if( self._savePresets(self.filePath, self.presets) ) {
                return true;
            } else {
                alert("Could not save presets to " + self.filePath);
            }
        }
        return false;
    }
    
    self.presetString = function( obj ) {
        return self.JSON.stringify(obj);
    }
    
    //-------------------------------------------------
    // E N D   P U B L I C   A P I
    //-------------------------------------------------
    
    // I N I T
    //---------    
    // Save the presets if not exist
    if(!self._fileExist( self.filePath ) ){
        if(! self._savePresets( self.filePath, self.presets ) ){
            alert("Failed to start Jaxon\nUnable to save presets to " + self.filePath);
            return null;
        }
    }
    // Load the presets
    self._loadPresets(self.filePath);
};

//----------------------------------------------------------------------------------








//----------------------------------------------------------------------------------
//
// Start JSON
//
//----------------------------------------------------------------------------------
//  json2.js
//  2016-10-28
//  Public Domain.
//  NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
//  See http://github.com/douglascrockford/JSON-js/blob/master/json2.js

// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== "object") {
    JSON = {};
}

(function () {
    "use strict";

    var rx_one = /^[\],:{}\s]*$/;
    var rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
    var rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
    var rx_four = /(?:^|:|,)(?:\s*\[)+/g;
    var rx_escapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
    var rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10
            ? "0" + n
            : n;
    }

    function this_value() {
        return this.valueOf();
    }

    if (typeof Date.prototype.toJSON !== "function") {

        Date.prototype.toJSON = function () {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear() + "-" +
                        f(this.getUTCMonth() + 1) + "-" +
                        f(this.getUTCDate()) + "T" +
                        f(this.getUTCHours()) + ":" +
                        f(this.getUTCMinutes()) + ":" +
                        f(this.getUTCSeconds()) + "Z"
                : null;
        };

        Boolean.prototype.toJSON = this_value;
        Number.prototype.toJSON = this_value;
        String.prototype.toJSON = this_value;
    }

    var gap;
    var indent;
    var meta;
    var rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        rx_escapable.lastIndex = 0;
        return rx_escapable.test(string)
            ? "\"" + string.replace(rx_escapable, function (a) {
                var c = meta[a];
                return typeof c === "string"
                    ? c
                    : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
            }) + "\""
            : "\"" + string + "\"";
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i;          // The loop counter.
        var k;          // The member key.
        var v;          // The member value.
        var length;
        var mind = gap;
        var partial;
        var value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === "object" &&
                typeof value.toJSON === "function") {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === "function") {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case "string":
            return quote(value);

        case "number":

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value)
                ? String(value)
                : "null";

        case "boolean":
        case "null":

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce "null". The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is "object", we might be dealing with an object or an array or
// null.

        case "object":

// Due to a specification blunder in ECMAScript, typeof null is "object",
// so watch out for that case.

            if (!value) {
                return "null";
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === "[object Array]") {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || "null";
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? "[]"
                    : gap
                        ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]"
                        : "[" + partial.join(",") + "]";
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === "object") {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === "string") {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (
                                gap
                                    ? ": "
                                    : ":"
                            ) + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (
                                gap
                                    ? ": "
                                    : ":"
                            ) + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? "{}"
                : gap
                    ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}"
                    : "{" + partial.join(",") + "}";
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== "function") {
        meta = {    // table of character substitutions
            "\b": "\\b",
            "\t": "\\t",
            "\n": "\\n",
            "\f": "\\f",
            "\r": "\\r",
            "\"": "\\\"",
            "\\": "\\\\"
        };
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = "";
            indent = "";

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === "number") {
                for (i = 0; i < space; i += 1) {
                    indent += " ";
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === "string") {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== "function" &&
                    (typeof replacer !== "object" ||
                    typeof replacer.length !== "number")) {
                throw new Error("JSON.stringify");
            }

// Make a fake root object containing our value under the key of "".
// Return the result of stringifying the value.

            return str("", {"": value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== "function") {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k;
                var v;
                var value = holder[key];
                if (value && typeof value === "object") {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            rx_dangerous.lastIndex = 0;
            if (rx_dangerous.test(text)) {
                text = text.replace(rx_dangerous, function (a) {
                    return "\\u" +
                            ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with "()" and "new"
// because they can cause invocation, and "=" because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with "@" (a non-JSON character). Second, we
// replace all simple value tokens with "]" characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or "]" or
// "," or ":" or "{" or "}". If that is so, then the text is safe for eval.

            if (
                rx_one.test(
                    text
                        .replace(rx_two, "@")
                        .replace(rx_three, "]")
                        .replace(rx_four, "")
                )
            ) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The "{" operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval("(" + text + ")");

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return (typeof reviver === "function")
                    ? walk({"": j}, "")
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError("JSON.parse");
        };
    }
}());

// EOF


