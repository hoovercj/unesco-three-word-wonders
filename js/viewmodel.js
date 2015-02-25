var licenses = [{
        "id": "0",
        "name": "All Rights Reserved"
    },{
        "id": "1",
        "name": "Attribution-NonCommercial-ShareAlike License",
        "url": "http://creativecommons.org/licenses/by-nc-sa/2.0/",
        "code": "by-nc-sa"
    },{
        "id": "2",
        "name": "Attribution-NonCommercial License",
        "url": "http://creativecommons.org/licenses/by-nc/2.0/",
        "code": "by-nc"
    },{
        "id": "3",
        "name": "Attribution-NonCommercial-NoDerivs License",
        "url": "http://creativecommons.org/licenses/by-nc-nd/2.0/",
        "code": "by-nc-nd"
    },{
        "id": "4",
        "name": "Attribution License",
        "url": "http://creativecommons.org/licenses/by/2.0/",
        "code": "by"
    },{
        "id": "5",
        "name": "Attribution-ShareAlike License",
        "url": "http://creativecommons.org/licenses/by-sa/2.0/",
        "code": "by-sa"
    },{
        "id": "6",
        "name": "Attribution-NoDerivs License",
        "url": "http://creativecommons.org/licenses/by-nd/2.0/",
        "code": "by-nd"
    },{
        "id": "7",
        "name": "No known copyright restrictions",
        "url": "http://flickr.com/commons/usage/",
    },{
        "id": "8",
        "name": "United States Government Work",
        "url": "http://www.usa.gov/copyright.shtml",
    }
];

function UnescoSite(site) {
	var self = this;	
	self.name = site['name_en'];
    self.description = site['short_description_en'];
    self.latitude = site.latitude;
    self.longitude = site.longitude;
    self.state = site['states_name_en'];
    self.threeWords = ko.observable();
    self.threeWordsUrl = ko.computed(function () {
        return 'http://w3w.co/' + self.threeWords();
    });
    self.mapUrl = ko.computed(function () {
        return 'https://maps.googleapis.com/maps/api/staticmap?center=' + self.latitude + ',' + self.longitude + 
            '&zoom=7&size=600x300&maptype=roadmap&markers=icon:' + 'http://www.codyhoover.com/unesco-three-word-wonders/img/what3words_pin_small.png|' +
            + self.latitude + ',' + self.longitude;
    });
}

function Photo(photo) {
    var self = this;
    self.title = photo.title;
    self.id = photo.id;
    self.ownerId = photo.owner;
    self.ownerUrl = 'https://www.flickr.com/photos/' + self.ownerId;
    self.ownerName = ko.observable();
    self.farm = photo.farm;
    self.server = photo.server;    
    self.secret = photo.secret;
    self.thumbUrl = 'https://farm' + self.farm + '.staticflickr.com/' + self.server + '/' + self.id + '_' + self.secret + '_n.jpg';
    self.largeUrl = ko.observable();
    self.pageUrl = 'https://www.flickr.com/photos/' + self.ownerId + '/' + self.id
    self.licenseName = ko.observable();
    self.licenseUrl = ko.observable();
    self.licenseImageUrl = ko.observable();
    self.imageTip = ko.computed(function () {
        return self.title + ' by ' + self.ownerName() + ', on Flickr';
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

    self.queryFlickr = function () {
        var flickrUrl = 'https://api.flickr.com/services/rest';
        var params = { 
            'api_key':'0fb57b23161e29d12733e2d491969b93',
            'text': self.activeSite().name,
            'sort': 'interestingness-desc',
            'license':'1,2,3,4,5,6',
            'per_page':'8',
            'method':'flickr.photos.search',
            'format':'json',
            'nojsoncallback':'1'
        };
        $.get( flickrUrl, params, function (data) {
            if(data.stat === 'ok') {
                self.photos(data.photos.photo.map( function (photo) {
                    var newPhoto = new Photo(photo);
                    self.queryFlickrPhotoInfo(newPhoto);
                    self.queryFlickrPhotoSizes(newPhoto);
                    return newPhoto;
                }));
            } else {
                console.log('error getting flickr photos');
            }            
        });
    };

    self.queryFlickrPhotoInfo = function (photo) {
        var flickrUrl = 'https://api.flickr.com/services/rest';
        var params = { 
            'api_key':'0fb57b23161e29d12733e2d491969b93',
            'photo_id': photo.id,
            'method':'flickr.photos.getInfo',
            'format':'json',
            'nojsoncallback':'1'
        };
        $.get( flickrUrl, params, function (data) {
            console.dir(data);
            if (data.photo.owner['path_alias']) {
                photo.ownerName(data.photo.owner['path_alias']);
            } else if (data.photo.owner['username']) {
                photo.ownerName(data.photo.owner['username']);
            } else if (data.photo.owner['realname']) {
                photo.ownerName(data.photo.owner['realname']);
            } else {
                photo.ownerName('unknown');
            }
            photo.licenseName(licenses[data.photo.license].name);
            photo.licenseUrl(licenses[data.photo.license].url);
            photo.licenseImageUrl("http://i.creativecommons.org/l/" + licenses[data.photo.license].code + "/2.0/80x15.png");
        });
    };

    self.queryFlickrPhotoSizes = function (photo) {
        var flickrUrl = 'https://api.flickr.com/services/rest';
        var params = { 
            'api_key':'0fb57b23161e29d12733e2d491969b93',
            'photo_id': photo.id,
            'method':'flickr.photos.getSizes',
            'format':'json',
            'nojsoncallback':'1'
        };
        $.get( flickrUrl, params, function (data) {
            for(var i = data.sizes.size.length - 1; i >= 0; i--) {
                if (data.sizes.size[i].label !== 'Original') {
                    photo.largeUrl(data.sizes.size[i].source);
                    return;
                }
            }
        });        
    }


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

    self.activateRandomSite = function () {
        location.hash = Math.floor((Math.random() * self.unescoSites().length) + 1);
    }
}

var viewModel = new ViewModel();
ko.applyBindings(viewModel);