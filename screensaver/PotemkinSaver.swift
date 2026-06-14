// Potemkin Pipeline — macOS screensaver wrapper.
// A ScreenSaverView that hosts a WKWebView rendering the single-file app
// (index.html, bundled as a resource). The webview drives its own rAF loop,
// so we never call into animateOneFrame — this view is just a host + black backdrop.
//
// Built into a loadable bundle by ../build-saver.sh. NSPrincipalClass in
// Info.plist must match the @objc class name below: PotemkinSaverView.

import ScreenSaver
import WebKit

@objc(PotemkinSaverView)
final class PotemkinSaverView: ScreenSaverView {
    private var webView: WKWebView?
    private var loaded = false

    override init?(frame: NSRect, isPreview: Bool) {
        super.init(frame: frame, isPreview: isPreview)
        commonInit()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        commonInit()
    }

    private func commonInit() {
        // The webview animates itself; a slow tick is enough to satisfy the framework.
        animationTimeInterval = 1.0 / 10.0
        wantsLayer = true
        layer?.backgroundColor = NSColor.black.cgColor

        let config = WKWebViewConfiguration()
        // Let the app's synthesized WebAudio / animations start without a user gesture.
        config.mediaTypesRequiringUserActionForPlayback = []
        config.suppressesIncrementalRendering = false

        let wv = WKWebView(frame: bounds, configuration: config)
        wv.autoresizingMask = [.width, .height]
        wv.setValue(false, forKey: "drawsBackground")  // avoid the white flash before first paint
        if #available(macOS 12.0, *) { wv.underPageBackgroundColor = .black }
        addSubview(wv)
        webView = wv
    }

    // Defer the actual load until the view is on screen and sized — loading into a
    // zero-size or off-screen webview can leave a blank WebContent process.
    override func startAnimation() {
        super.startAnimation()
        loadIfNeeded()
    }

    override func viewDidMoveToWindow() {
        super.viewDidMoveToWindow()
        if window != nil { loadIfNeeded() }
    }

    private func loadIfNeeded() {
        guard !loaded, let wv = webView, window != nil, bounds.width > 0 else { return }
        guard let url = Bundle(for: PotemkinSaverView.self).url(forResource: "index", withExtension: "html"),
              let html = try? String(contentsOf: url, encoding: .utf8) else { return }
        loaded = true
        wv.frame = bounds
        // baseURL points at Resources so any (currently none) relative refs resolve.
        wv.loadHTMLString(html, baseURL: url.deletingLastPathComponent())
    }

    override func stopAnimation() {
        super.stopAnimation()
    }

    override func draw(_ rect: NSRect) {
        NSColor.black.setFill()
        rect.fill()
    }

    override func animateOneFrame() {}

    override var hasConfigureSheet: Bool { false }
    override var configureSheet: NSWindow? { nil }
}
