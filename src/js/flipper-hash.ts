///<reference path="jquery.d.ts" />
///<reference path="flipper.d.ts" />

$(document).ready(() => {

    var regex = /#magazine:(\d+)/i;
    
    function refresh() {
        var hash = window.location.hash || '#';
        var res = regex.exec(hash);
        var $pageTurn = $('.page-turn.hash');
        if (res) {
            var pageNumber = parseInt(res[1], 10);
            var pageTurn = $pageTurn.pageTurn();
            pageTurn.navigate(pageNumber);
        }
        $pageTurn.toggleClass('opened', !!res);
    }

    $(window).bind('hashchange', () => {
        refresh();
    });

    refresh();

    $('body').on('page-change', '.page-turn', (ev, pageNumber) => {
        window.location.hash = `#magazine:${pageNumber}`;
    })

});