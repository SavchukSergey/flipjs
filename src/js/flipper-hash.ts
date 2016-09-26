///<reference path="jquery.d.ts" />
///<reference path="flipper.d.ts" />

$(document).ready(() => {

    var regex = /#magazine:(\d+)/i;
    
    function refresh() {
        var hash = window.location.hash || '#';
        var res = regex.exec(hash);
        if (res) {
            var pageNumber = parseInt(res[1], 10);
            var pageTurn = $('.page-turn').pageTurn();
            pageTurn.navigate(pageNumber);
        }
    }

    $(window).bind('hashchange', () => {
        refresh();
    });

    refresh();

});