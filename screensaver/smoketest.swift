// Headless verification: load the built .saver, instantiate its principal
// ScreenSaverView in an off-screen window, and confirm the hosted WKWebView
// actually renders the app (non-empty title + live log lines in the DOM).
// Not shipped in the bundle — used only by build verification.
import AppKit
import WebKit
import ScreenSaver

let saverPath = CommandLine.arguments.count > 1
    ? CommandLine.arguments[1]
    : "Potemkin Pipeline.saver"

let app = NSApplication.shared
app.setActivationPolicy(.accessory)

guard let bundle = Bundle(path: saverPath) else { print("FAIL: cannot open bundle"); exit(1) }
guard bundle.load() else { print("FAIL: bundle.load() failed"); exit(1) }
guard let cls = bundle.principalClass as? ScreenSaverView.Type else {
    print("FAIL: principalClass is not a ScreenSaverView subclass"); exit(1)
}
print("OK: principalClass = \(cls)")

let frame = NSRect(x: 0, y: 0, width: 1280, height: 800)
guard let view = cls.init(frame: frame, isPreview: false) else { print("FAIL: init returned nil"); exit(1) }

// On-screen + frontmost so the page is NOT considered hidden (the app pauses its
// rAF engine when document.hidden — correct behavior we must avoid to verify rendering).
let win = NSWindow(contentRect: NSRect(x: 120, y: 120, width: 720, height: 460),
                   styleMask: [.borderless], backing: .buffered, defer: false)
win.contentView = view
win.level = .floating
win.makeKeyAndOrderFront(nil)
app.activate(ignoringOtherApps: true)
view.startAnimation()

func findWebView(_ v: NSView) -> WKWebView? {
    if let w = v as? WKWebView { return w }
    for s in v.subviews { if let w = findWebView(s) { return w } }
    return nil
}

DispatchQueue.main.asyncAfter(deadline: .now() + 4.0) {
    guard let wv = findWebView(view) else { print("FAIL: no WKWebView in view hierarchy"); exit(1) }
    wv.evaluateJavaScript("[document.title, document.querySelectorAll('#log .ln').length, document.visibilityState].join('|')") { res, err in
        if let err = err { print("FAIL: JS error \(err)"); exit(1) }
        let s = (res as? String) ?? "nil"
        let parts = s.split(separator: "|", maxSplits: 2).map(String.init)
        let title = parts.first ?? ""
        let lines = parts.count > 1 ? (Int(parts[1]) ?? 0) : 0
        let vis = parts.count > 2 ? parts[2] : "?"
        print("OK: title=\"\(title)\" logLines=\(lines) visibility=\(vis)")
        print(title.isEmpty == false && lines > 0 ? "PASS" : "FAIL: app did not render content")
        exit(title.isEmpty == false && lines > 0 ? 0 : 1)
    }
}

DispatchQueue.main.asyncAfter(deadline: .now() + 10.0) { print("FAIL: timeout"); exit(1) }
app.run()
