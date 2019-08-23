module.exports = {
    bundles: {
        clientJavaScript: {
            main: {
                file: '/js/meadowlark.min.1b4f7c59.js',
                location: 'head',
                contents: [
                    '/js/contact.js',
                    '/js/cart.js'
                ]
            }
        },
        clientCss: {
            main: {
                file: '/css/meadowlark.min.d41d8cd9.css',
                contents: [
                    '/css/main.css',
                    '/css/cart.css'
                ]
            }
        }
    }
}