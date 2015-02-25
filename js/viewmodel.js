function UnescoSite(site) {
	var self = this;	
	self.name = site['name_en'];
    self.description = site['short_description_en'];
    self.latitude = site.latitude;
    self.longitude = site.longitude;
    self.state = site['states_name_en'];
    self.threeWords = ko.observable();
    self.threeWordsURL = ko.computed(function () {
        return 'http://w3w.co/' + self.threeWords();
    });
    self.mapURL = ko.computed(function () {
        return 'https://maps.googleapis.com/maps/api/staticmap?center=' + self.latitude + ',' + self.longitude + 
            '&zoom=7&size=600x300&maptype=roadmap&markers=icon:' + 'http://www.codyhoover.com/unesco-three-word-wonders/img/what3words_pin_small.png|' +
            + self.latitude + ',' + self.longitude;
    });
}

var ViewModel = function() {
	var self = this;
    self.searchTerm = ko.observable();
	self.photos = ko.observableArray([]);
    self.unescoSites = ko.observableArray([]);
    self.activeSite = ko.observable();

    $.getJSON('js/unesco.json', function (data) {
        self.unescoSites(data.map( function (site) {
            return new UnescoSite(site);
        }));
        Sammy(initSammy).run();
    });

    // Client-side routes
    var initSammy = function() {
        this.get('#:index', function() {
            self.activateSite(this.params.index);
        });

        this.get('', function() {
            self.activateRandomSite();
        });
    }   

    self.activateSite = function (index) {
        self.activeSite(self.unescoSites()[index]);
        self.queryFlickr();
        if (!self.activeSite().threeWords() || self.activeSite().threeWords().length === 0) {
            var position = [self.activeSite().latitude, self.activeSite().longitude];
            What3words.positionToWords(position, function (ret) {                
                self.activeSite().threeWords(ret[0] + '.' + ret[1] + '.' + ret[2]);
            });
        }       
    }

    function getUrlFromPhoto (photo) {
        return 'https://farm' + photo.farm + '.staticflickr.com/' + photo.server + '/' + photo.id + '_' + photo.secret + '_n.jpg';
    }

    self.activateRandomSite = function () {
        location.hash = Math.floor((Math.random() * self.unescoSites().length) + 1);
    }

    self.queryFlickr = function () {
        var flickrURL = 'https://api.flickr.com/services/rest';
        var params = { 
            'api_key':'0fb57b23161e29d12733e2d491969b93',
            'text': self.activeSite().name,
            'sort': 'interestingness-desc',
            'license':'1,2,3,4,5,6,6,7,8',
            'per_page':'8',
            'method':'flickr.photos.search',
            'format':'json',
            'nojsoncallback':'1'
        };
        $.get( flickrURL, params, function (data) {
            if(data.stat === 'ok') {
                self.photos(data.photos.photo.map(getUrlFromPhoto));
            } else {
                console.log('error getting flickr photos');
            }            
        });
    }
}

var viewModel = new ViewModel();
ko.applyBindings(viewModel);