//default image setup
var img = new Image();
img.src = './images/flower.jpeg';
img.crossOrigin = "Anonymous";
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

//storage variables
var pixels = {};
var sortedPixels = []
var liveColors = []

var fitImage = function(canvas, imageObj) {
	var imageAspectRatio = imageObj.width / imageObj.height;
	var canvasAspectRatio = canvas.width / canvas.height;
	var renderableHeight, renderableWidth, xStart, yStart;

	// If image's aspect ratio is less than canvas's we fit on height
	// and place the image centrally along width
	if(imageAspectRatio < canvasAspectRatio) {
		renderableHeight = canvas.height;
		renderableWidth = imageObj.width * (renderableHeight / imageObj.height);
		xStart = (canvas.width - renderableWidth) / 2;
		yStart = 0;
	}

	// If image's aspect ratio is greater than canvas's we fit on width
	// and place the image centrally along height
	else if(imageAspectRatio > canvasAspectRatio) {
		renderableWidth = canvas.width
		renderableHeight = imageObj.height * (renderableWidth / imageObj.width);
		xStart = 0;
		yStart = (canvas.height - renderableHeight) / 2;
	}

	// Happy path - keep aspect ratio
	else {
		renderableHeight = canvas.height;
		renderableWidth = canvas.width;
		xStart = 0;
		yStart = 0;
	}
	ctx.drawImage(imageObj, xStart, yStart, renderableWidth, renderableHeight);
};

//set the default canvas image 
img.onload = function () {
    ctx.imageSmoothingEnabled = false;

    setTimeout(function () {
        fitImage(canvas,img)
        getPixels();
    }, 100); // wait for this.result to load in 

};

//custom sort function 
function largest(a, b) {
    if (a[1] === b[1]) {
        return 0;
    } else {
        return (a[1] > b[1]) ? -1 : 1;
    }
}

function sortPixels() {
    for (var key in pixels) {
        sortedPixels.push([key, pixels[key]]);
    }

    sortedPixels.sort(largest);
}

//main function, get and sort all fixels in the current image
function getPixels() {

    pixels = {};
    sortedPixels = [];
	
	//console.time("pixels");
    imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    //loop through image data
    for (row = 0; row < canvas.height; row+= 15) { //skip by ? pixels 
        for (col = 0; col < canvas.width; col+= 15) { //skip by ? pixels
            //find current pixel
            index = (col + (row * imgData.width)) * 4; 
            //separate into color values
            r = imgData.data[index];
            g = imgData.data[index + 1];
            b = imgData.data[index + 2];
            a = imgData.data[index + 3];
            
            if(r == 0 && g == 0 && b == 0 && a == 0){continue} //skip transparent colors

            a /= 255;

			var color = `rgba(${r},${g},${b},${a})`	
			
			shrink(r,g,b,color) //append color to pixels 

        }
    }
    //console.timeEnd("pixels");
    sortPixels()
    pasteColors()
}

function shrink(red,green,blue,color){ // combine similer color values
	var gauge = 7//within ? px 
	
	//exact match
	if (pixels[color]) {
		pixels[color] = pixels[color] + 1
		return 
	} 
	
	for(var x = (gauge * -1); x <= gauge;x++){ //check red
		temp_red = red;
		temp_red += x;
		var temp_color = `rgba(${temp_red},${green},${blue},1)`
		if(pixels[temp_color]){
			pixels[temp_color] += 1
			return
		}
		for(var y = (gauge * -1); y <= gauge;y++){ //check green
			temp_green = green;
			temp_green += y;
			var temp_color = `rgba(${temp_red},${temp_green},${blue},1)`
			if(pixels[temp_color]){
				pixels[temp_color] += 1
				return
			}
			for(var z = (gauge * -1); z <= gauge;z++){ //check blue
				temp_blue = blue;
				temp_blue += z;
				var temp_color = `rgba(${temp_red},${temp_green},${temp_blue},1)`
				if(pixels[temp_color]){
					pixels[temp_color] += 1
					return
				}
			}
		}
	}
		
	//new color value 
	pixels[color] = 1
	
}

function paint() {
    $("#bar").css("background-color", `${sortedPixels[0][0]}`)
    var colorCount = $('#colorCount').find(":selected").text();

    var rotateDeg = 360 / colorCount;
    var rotate = 0;
    var gradient = "";

    for (var i = 0; i < colorCount; i++) {
        gradient += `linear-gradient(${rotate}deg,${liveColors[i]},transparent),`
        rotate += rotateDeg
    }
    gradient = gradient.slice(0, gradient.length - 1)
    $("#main-image").css("background", gradient)

}


function pasteColors() {
    //clear values 
    liveColors = []
    $("#colors").html("")

    var count = $(".select-selected").get()[0].innerHTML
 
    for (var i = 0; i < count; i++) {

        var color = sortedPixels[i][0] 

        liveColors.push(color)

        $("#colors").append(`<div class='h10 w70 margin30-top @shadow flex mask-handle' style='background-color:${color}'><div class="flex h100 w100 mask white">
		<p style="color:rgba(0,0,0,.5);margin:0px;word-wrap: break-word;">${color}</p></div></div>`)

    }
    paint() //change color of ui page elements 
}


//event listeners
$("#upload").click(function () {
    $("#hidden-upload").click()
})

$("#hidden-upload").change(function () {

    ctx.clearRect(0, 0, canvas.width, canvas.height); //clear canvas

    var file = document.getElementById("hidden-upload").files[0]
    var reader = new FileReader();

    reader.addEventListener("load", function () {
        var i = new Image();
        i.src = this.result;

        setTimeout(function () {
            fitImage(canvas,i);
            getPixels();
        }, 200); // wait for this.result to load in 

    }, false);

    reader.readAsDataURL(file);

})
