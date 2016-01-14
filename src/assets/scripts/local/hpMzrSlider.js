/*
 * jQuery hp-mzr-slider v0.1
 *
 *
 */

(function($) {
  $.hpMzrSlider = function(el, options) {
    var slider = $(el);

    slider.vars = $.extend({}, $.hpMzrSlider.defaults, options);

    var methods = {};

    $.data(el, "hpMzrSlider", slider);

    methods = {
      init: function() {
        slider.vars.parentID = slider.parent().attr('id');
        slider.vars.maxItemWidth = 0;
        slider.vars.maxItemHeight = 0;
        slider.vars.elements = [];
        slider.vars.elementsNonMobile = [];
        slider.vars.currentItemIndex = 0;
        slider.vars.itemsViewable = 0;
        slider.vars.widthPercentPerItem = 100;
        slider.vars.indicators = [];
        slider.vars.container = null;
        slider.vars.modeMobile = false;

        slider.vars.touchXStart = null;
        slider.vars.touchXLast = null;
        slider.vars.touchYStart = null;
        slider.vars.touchYLast = null;

        var element = $(slider).find(slider.vars.selector).detach();
        $(slider).prepend("<div class='hpMzrSlider-slider-container'></div>");
        slider.vars.container = $(slider).find('.hpMzrSlider-slider-container');
        slider.vars.container.append(element).css('overflow', 'hidden');

        $(element).each(function() {
          slider.vars.elements.push($(this));
          if ($(this).data('display-on') != 'mobile') {
            slider.vars.elementsNonMobile.push($(this));
          }
          slider.vars.maxItemWidth = ($(this).width() > slider.vars.maxItemWidth) ? $(this).width() : slider.vars.maxItemWidth;
          slider.vars.maxItemHeight = ($(this).height() > slider.vars.maxItemHeight) ? $(this).height() : slider.vars.maxItemHeight;
        });

        slider.vars.container.css('height', slider.vars.maxItemHeight + 'px');
        //slider.vars.container.parent().css('min-height',   slider.vars.maxItemHeight + 'px');

        $(slider.vars.elements).each(function() {
          $(this).on('touchstart', methods.touchStartElement);
          $(this).on('touchmove', methods.touchMoveElement);
        });

        slider.prepend("<div class='hpMzrSlider-slider-nav'>" +
          "<div class='controls-container'>" +
          "<button class='hpMzrSlider-slider-prev' onmousedown='try{trackMetrics(\'newLink\',{name:\'ipg:cmpgn:security:secureprinting:leftarrow\'});}catch(e){}'></button>" +
          "<button class='hpMzrSlider-slider-next' onmousedown='try{trackMetrics(\'newLink\',{name:\'ipg:cmpgn:security:secureprinting:rightarrow\'});}catch(e){}'></button>" +
          "<div class='hpMzrSlider-slider-indicators'></div></div></div>");
        slider.vars.indicatorContainer = slider.find('.hpMzrSlider-slider-indicators');

        $(slider.vars.elements).each(function(index) {
          slider.vars.indicatorContainer.append("<div class='hpMzrSlider-slider-indicator' data-index='" + index + "'></div>");
        });
        slider.vars.indicators = slider.find('.hpMzrSlider-slider-indicator');

        $(window).on("resize orientationchange", methods.resize);

        // forcing to be click, as touchends are part of gestures
        var eventsToBind = 'click'; //(Modernizr.touch) ? 'touchend' : 'click';
        slider.find('.hpMzrSlider-slider-prev').on(eventsToBind, methods.showPrevious);
        slider.find('.hpMzrSlider-slider-next').on(eventsToBind, methods.showNext);
        //6-24-15
        slider.find('.hpMzrSlider-slider-prev').on(eventsToBind, methods.removeModal);
        slider.find('.hpMzrSlider-slider-next').on(eventsToBind, methods.removeModal);

        slider.vars.indicators.on(eventsToBind, methods.showIndicated);


        slider.vars.container.on('touchstart', methods.touchStart);

        methods.resize();
      },
      resize: function(event) {
        slider.vars.modeMobile = $(window).width() <= slider.vars.maxWidthForMobile;

        var elements = (slider.vars.modeMobile) ? slider.vars.elements : slider.vars.elementsNonMobile;

        slider.vars.sliderWidth = $(slider).width();
        slider.vars.sliderHeight = $(slider).height();

        if (slider.vars.modeMobile) {
          slider.vars.itemsViewable = 1;
          slider.vars.widthPercentPerItem = 100;
          methods.repositionElements();
          slider.vars.container.parent().css('min-height', slider.vars.maxItemHeight + 'px');
          return;
        }


        if ((slider.vars.sliderWidth - $(slider).width()) === 0 && (slider.vars.sliderHeight - $(slider).height())) return;

        $(slider.vars.elements).each(function() {
          $(this).css('opacity', 0).css('display', 'none');
        });
        slider.vars.container.parent().css('min-height', slider.vars.maxItemHeight + 'px');
        for (var numToShow = elements.length; numToShow > 0; numToShow--) {
          if ((numToShow * slider.vars.maxItemWidth + (numToShow - 1) * slider.vars.minimumItemSpacing) <= slider.width()) {

            if (numToShow == slider.vars.itemsViewable) {
              break;
            }
            slider.vars.itemsViewable = numToShow;
            slider.vars.widthPercentPerItem = 100 / slider.vars.itemsViewable;

            if (slider.vars.itemsViewable < elements.length) {
              slider.find('.hpMzrSlider-slider-nav').css('display', 'block');
            } else {
              slider.find('.hpMzrSlider-slider-nav').css('display', 'none');
            }

            break;
          }
        }
        methods.repositionElements();
      },
      repositionElements: function() {
        var elements = ($(window).width() > slider.vars.maxWidthForMobile) ? slider.vars.elementsNonMobile : slider.vars.elements;
        slider.vars.modeMobile = $(window).width() <= slider.vars.maxWidthForMobile;

        var infiniteScroll = slider.vars.infiniteSlide;
        if (slider.vars.modeMobile) {
          infiniteScroll = slider.vars.infiniteSlideMobile;
        }

        if (slider.vars.currentItemIndex + slider.vars.itemsViewable > elements.length) {
          if (infiniteScroll) {
            slider.vars.currentItemIndex = 0;
          } else {
            slider.vars.currentItemIndex = elements.length - slider.vars.itemsViewable;
          }
        }

        if (slider.vars.currentItemIndex < 0) {
          if (infiniteScroll) {
            slider.vars.currentItemIndex = elements.length - slider.vars.itemsViewable;
          } else {
            slider.vars.currentItemIndex = 0;
          }
        }

        var percentSoFar = -slider.vars.currentItemIndex * slider.vars.widthPercentPerItem;
        slider.find('.hpMzrSlider-slider-prev').toggleClass('active', (percentSoFar < 0));
        $(elements).each(function(index) {
          var opacity = (percentSoFar >= 0 && percentSoFar < 100) ? 1 : 0;
          var height = (slider.vars.modeMobile) ? window.innerHeight - 60 : slider.vars.maxItemHeight;
          $(this)
            .scrollTop(0)
            .css('display', 'inline-block')
            .css('width', slider.vars.widthPercentPerItem + '%')
            .css('position', 'absolute')
            .css('left', percentSoFar + '%')
            .css('opacity', opacity)
            .css('top', '0');
          //.css('height',     height + 'px');
          if (percentSoFar === 0) {
            methods.setActiveIndicator(index);
          }
          percentSoFar += slider.vars.widthPercentPerItem;
        });
        slider.find('.hpMzrSlider-slider-next').toggleClass('active', (Math.floor(percentSoFar) > 100));
      },
      setActiveIndicator: function(index) {
        slider.vars.indicators.removeClass('active');
        $(slider.vars.indicators[index]).addClass('active');
      },
      showPrevious: function() {
        slider.vars.currentItemIndex--;
        methods.repositionElements();
      },
      showNext: function() {
        slider.vars.currentItemIndex++;
        methods.repositionElements();
      },
      showIndicated: function(event) {
        slider.vars.currentItemIndex = $(this).data('index');
        methods.repositionElements();
      },
      showIndicatedByNumber: function(number) {
        slider.vars.currentItemIndex = number;
        methods.repositionElements();
      },
      //6-24-15
      removeModal: function() {
        $('.mobile-pdf-viewer').remove();
      },
      touchStart: function(event) {
        //console.log('touchStart() ' + slider.vars.parentID);
        if ((event.timeStamp - slider.vars.touchTimeStart) <= 300) {
          event.preventDefault();
        }
        slider.vars.touchTimeStart = event.timeStamp;

        if (slider.vars.touchXStart !== null) return; // some reason getting double touchStarts on Safari-Mobile

        slider.vars.touchXStart = event.originalEvent.touches ? event.originalEvent.touches[0].screenX : event.screenX;
        slider.vars.touchXLast = slider.vars.touchXStart;
        slider.vars.touchYStart = event.originalEvent.touches ? event.originalEvent.touches[0].screenY : event.screenY;
        slider.vars.touchYLast = slider.vars.touchYStart;

        //console.log('touchStart() ' + slider.vars.parentID + " :: " + slider.vars.touchXStart + ", " + slider.vars.touchYStart);
        slider.vars.container.on('touchmove', methods.touchMove);
        slider.vars.container.on('touchend', methods.touchEnd);
      },
      touchMove: function(event) {
        //console.log('touchMove()  ' + slider.vars.parentID);
        // if (slider.hasClass('locked')) {
        //   event.preventDefault();
        // }

        var currentX = event.originalEvent.touches ? event.originalEvent.touches[0].screenX : event.screenX;
        var currentY = event.originalEvent.touches ? event.originalEvent.touches[0].screenY : event.screenY;

        var deltaX = (slider.vars.touchXStart - currentX);
        var deltaY = (slider.vars.touchYStart - currentY);


        //console.log('touchMove()  ' + slider.vars.parentID + ' -- ' + deltaX + ", " + deltaY);

        if (Math.abs(deltaX) > Math.abs(2 * deltaY) && // X motion is more than twice the up/down
          Math.abs(deltaX) >= slider.vars.swipeTolerance) { // X motion is more than swipe motion needed
          //slider.vars.container.unbind('touchmove', methods.touchMove);
          if (deltaX > 0) { // left
            //console.log(slider.vars.parentID + "().showNext():     " + deltaX + ", " + deltaY);
            methods.showNext();
          } else { // right
            //console.log(slider.vars.parentID + "().showPrevious(): " + deltaX + ", " + deltaY);
            methods.showPrevious();
          }
          methods.touchEnd();

          //slider.vars.touchXStart = null;
          //slider.vars.touchXLast  = null;
          //slider.vars.touchYStart = null;
          //slider.vars.touchYLast  = null;
        }
      },
      touchEnd: function(event) {
        slider.vars.container.unbind('touchmove', methods.touchMove);
        slider.vars.container.unbind('touchend', methods.touchEnd);
        slider.vars.touchXStart = null;
        slider.vars.touchXLast = null;
        slider.vars.touchYStart = null;
        slider.vars.touchYLast = null;
      },

      touchStartElement: function(event) {
        slider.vars.touchYStartElement = event.originalEvent.touches ? event.originalEvent.touches[0].screenY : event.screenY;
      },
      touchMoveElement: function(event) {
        // if (slider.hasClass('locked')) {
        //   var currentY = event.originalEvent.touches ? event.originalEvent.touches[0].screenY : event.screenY;
        //   var deltaY = currentY - slider.vars.touchYStartElement;
        //   $(event.currentTarget).scrollTop($(event.currentTarget).scrollTop() - deltaY);
        //   slider.vars.touchYStartElement = currentY;
        // }
      }
    };
    methods.init();
    slider.methods = methods;
  };



  //hpMzrSlider: Default Settings
  $.hpMzrSlider.defaults = {
    minimumItemSpacing: 38,
    selector: ' > div',
    maxWidthForMobile: 767,
    infiniteSlide: false,
    infiniteSlideMobile: false,
    swipeTolerance: 50,
    sliderWidth: 0,
    sliderHeight: 0
  };

  //hpMzrSlider: Plugin Function
  $.fn.hpMzrSlider = function(options) {
    if (options === undefined) options = {};

    if (typeof options === "object") {
      return this.each(function() {
        var $this = $(this);

        if ($this.data('hpMzrSlider') === undefined) {
          new $.hpMzrSlider(this, options);
        }
      });
    } else {
      // Helper strings to quickly perform functions on the slider
      var $slider = $(this).data('hpMzrSlider');
    }
  };

})(jQuery);

$(window).load(function() {
  $('#copy .hp-mzr-slider').hpMzrSlider({
    selector: ' > div'
  });
});
