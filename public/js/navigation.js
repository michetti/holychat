function navigationFactory(config) {
  
  // Prepare menu itemsLoad Menu Data
  _prepareMenuItems();

  // Show first page
  var currentPageId = null;
  if (config.startPageId) {
    _showPage(config.startPageId);
  }


  function _prepareMenuItems() {
    $(config.menuItemsSelector).each(function(index) {
      var menuItem = $(this);

      menuItem.click(function() {
        console.log('aaaa');
        _showPage(menuItem.attr('href'));
      });

    });
  }

  function _showPage(pageId, callback) {
      if (!$(pageId + "_page")[0]) return;

      if (currentPageId) {
        
        $(currentPageId + "_page").fadeOut(function() {
          $(currentPageId + "_menu").removeClass('ui-state-highlight');
          
          $(pageId + "_menu").addClass('ui-state-highlight');
          $(pageId + "_page").fadeIn(function() {
            currentPageId = pageId;
          });

        });

      } else {
        $(pageId + "_menu").addClass('ui-state-highlight');
        $(pageId + "_page").fadeIn(function() {
          currentPageId = pageId;
        });
      }

  }

   // Object Interface
  return {

    showPage: function onShowPage(pageId, callback) {
      _showPage(pageId, callback);
    }
  }
  
}
