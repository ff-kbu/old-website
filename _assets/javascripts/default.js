$(document).ready(function(){
//	$('.title').clone().attr('id', 'sticky-title').prependTo('.menubar');
	$(".menubar").sticky({topSpacing:50});

	window.onresize = function(event) {
		$(".menubar").sticky('update');
	};

	$('.navbar-left a').each(function(){
		var target = $(this).attr('href');
		$(this).on('click', function() {
			$.smoothScroll({
				offset: -110,
				scrollTarget: target
			});
			return false;
		});
	}); 


	var active = 0;
	var activeNew = -1;
	$( window ).scroll(function() {
		var posView = $(document).scrollTop();
		var i = 0;
		if(posView<50){
			$('.navbar li a').removeClass('active');
			activeNew = -1;
		}else{
			activeNew = 0;
			active = -1;
			$('.scrollPos').each(function(){
				if (($('.pos' + i).position().top - 200)<posView){
					activeNew = i;
				}
				i = i + 1;
			});
			if (active != activeNew){
				active = activeNew;
				$('.navbar li a').removeClass('active');
				$('.navbar li a').eq(activeNew).addClass('active');
			}
		}
	}); 
	
});
