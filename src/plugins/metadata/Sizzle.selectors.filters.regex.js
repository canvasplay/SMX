Sizzle.selectors.filters.regex = function(elem, i, match){
    var regex = new RegExp('\\s*'+match[3]+'\\w*="', 'ig');
    var attrs = elem.attributes;
    var str = [];
    str.push('<'+elem.nodeName);
    for(var i=0;i<attrs.length;i++){
        str.push(attrs[i].nodeName+'="'+attrs[i].nodeValue+'"');
    }
    str.push('>');
    str = str.join(' ');

    return regex.test(str);
};