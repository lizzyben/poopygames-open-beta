"use strict";
window.DOMHandler = class {
    constructor(e, t) {
        this._iRuntime = e,
        this._componentId = t,
        this._hasTickCallback = !1,
        this._tickCallback = ()=>this.Tick()
    }
    Attach() {}
    PostToRuntime(e, t, n, a) {
        this._iRuntime.PostToRuntimeComponent(this._componentId, e, t, n, a)
    }
    PostToRuntimeAsync(e, t, n, a) {
        return this._iRuntime.PostToRuntimeComponentAsync(this._componentId, e, t, n, a)
    }
    _PostToRuntimeMaybeSync(e, t, n) {
        this._iRuntime.UsesWorker() ? this.PostToRuntime(e, t, n) : this._iRuntime._GetLocalRuntime()._OnMessageFromDOM({
            type: "event",
            component: this._componentId,
            handler: e,
            dispatchOpts: n || null,
            data: t,
            responseId: null
        })
    }
    AddRuntimeMessageHandler(e, t) {
        this._iRuntime.AddRuntimeComponentMessageHandler(this._componentId, e, t)
    }
    AddRuntimeMessageHandlers(e) {
        for (const [t,n] of e)
            this.AddRuntimeMessageHandler(t, n)
    }
    GetRuntimeInterface() {
        return this._iRuntime
    }
    GetComponentID() {
        return this._componentId
    }
    _StartTicking() {
        this._hasTickCallback || (this._iRuntime._AddRAFCallback(this._tickCallback),
        this._hasTickCallback = !0)
    }
    _StopTicking() {
        this._hasTickCallback && (this._iRuntime._RemoveRAFCallback(this._tickCallback),
        this._hasTickCallback = !1)
    }
    Tick() {}
}
,
window.RateLimiter = class {
    constructor(e, t) {
        this._callback = e,
        this._interval = t,
        this._timerId = -1,
        this._lastCallTime = -Infinity,
        this._timerCallFunc = ()=>this._OnTimer(),
        this._ignoreReset = !1,
        this._canRunImmediate = !1
    }
    SetCanRunImmediate(e) {
        this._canRunImmediate = !!e
    }
    Call() {
        if (-1 === this._timerId) {
            const e = Date.now()
              , t = e - this._lastCallTime
              , n = this._interval;
            t >= n && this._canRunImmediate ? (this._lastCallTime = e,
            this._RunCallback()) : this._timerId = self.setTimeout(this._timerCallFunc, Math.max(n - t, 4))
        }
    }
    _RunCallback() {
        this._ignoreReset = !0,
        this._callback(),
        this._ignoreReset = !1
    }
    Reset() {
        this._ignoreReset || (this._CancelTimer(),
        this._lastCallTime = Date.now())
    }
    _OnTimer() {
        this._timerId = -1,
        this._lastCallTime = Date.now(),
        this._RunCallback()
    }
    _CancelTimer() {
        -1 !== this._timerId && (self.clearTimeout(this._timerId),
        this._timerId = -1)
    }
    Release() {
        this._CancelTimer(),
        this._callback = null,
        this._timerCallFunc = null
    }
}
,
"use strict",
window.DOMElementHandler = class extends DOMHandler {
    constructor(e, t) {
        super(e, t),
        this._elementMap = new Map,
        this._autoAttach = !0,
        this.AddRuntimeMessageHandler("create", e=>this._OnCreate(e)),
        this.AddRuntimeMessageHandler("destroy", e=>this._OnDestroy(e)),
        this.AddRuntimeMessageHandler("set-visible", e=>this._OnSetVisible(e)),
        this.AddRuntimeMessageHandler("update-position", e=>this._OnUpdatePosition(e)),
        this.AddRuntimeMessageHandler("update-state", e=>this._OnUpdateState(e)),
        this.AddRuntimeMessageHandler("focus", e=>this._OnSetFocus(e)),
        this.AddRuntimeMessageHandler("set-css-style", e=>this._OnSetCssStyle(e))
    }
    SetAutoAttach(e) {
        this._autoAttach = !!e
    }
    AddDOMElementMessageHandler(e, t) {
        this.AddRuntimeMessageHandler(e, e=>{
            const n = e.elementId
              , a = this._elementMap.get(n);
            return t(a, e)
        }
        )
    }
    _OnCreate(e) {
        const t = e.elementId
          , n = this.CreateElement(t, e);
        this._elementMap.set(t, n),
        e.isVisible || (n.style.display = "none"),
        this._autoAttach && document.body.appendChild(n)
    }
    CreateElement() {
        throw new Error("required override")
    }
    DestroyElement() {}
    _OnDestroy(e) {
        const t = e.elementId
          , n = this._elementMap.get(t);
        this.DestroyElement(n),
        this._autoAttach && n.parentElement.removeChild(n),
        this._elementMap.delete(t)
    }
    PostToRuntimeElement(e, t, n) {
        n || (n = {}),
        n.elementId = t,
        this.PostToRuntime(e, n)
    }
    _PostToRuntimeElementMaybeSync(e, t, n) {
        n || (n = {}),
        n.elementId = t,
        this._PostToRuntimeMaybeSync(e, n)
    }
    _OnSetVisible(e) {
        if (this._autoAttach) {
            const t = this._elementMap.get(e.elementId);
            t.style.display = e.isVisible ? "" : "none"
        }
    }
    _OnUpdatePosition(e) {
        if (this._autoAttach) {
            const t = this._elementMap.get(e.elementId);
            t.style.left = e.left + "px",
            t.style.top = e.top + "px",
            t.style.width = e.width + "px",
            t.style.height = e.height + "px";
            const n = e.fontSize;
            null !== n && (t.style.fontSize = n + "em")
        }
    }
    _OnUpdateState(e) {
        const t = this._elementMap.get(e.elementId);
        this.UpdateState(t, e)
    }
    UpdateState() {
        throw new Error("required override")
    }
    _OnSetFocus(e) {
        const t = this._elementMap.get(e.elementId);
        e.focus ? t.focus() : t.blur()
    }
    _OnSetCssStyle(e) {
        const t = this._elementMap.get(e.elementId);
        t.style[e.prop] = e.val
    }
    GetElementById(e) {
        return this._elementMap.get(e)
    }
}
,
"use strict";
{
    function t(e) {
        console.log("--fx--e--", e);
        if (e.isStringSrc) {
            const t = document.createElement("script");
            t.async = !1,
            t.textContent = e.str,
            document.head.appendChild(t)
        } else
            return new Promise((t,n)=>{
                const a = document.createElement("script");
                a.onload = t,
                a.onerror = n,
                a.async = !1,
                a.src = e,
                document.head.appendChild(a)
            }
            )
    }
    async function r(e) {
        const t = await s(e)
          , n = new TextDecoder("utf-8");
        return n.decode(t)
    }
    function s(e) {
        console.log("--fx--se--", e);
        return new Promise((t,n)=>{
            const a = new FileReader;
            a.onload = e=>t(e.target.result),
            a.onerror = e=>n(e),
            a.readAsArrayBuffer(e)
        }
        )
    }
    function u(e) {
        return n.has(e)
    }
    const a = /(iphone|ipod|ipad)/i.test(navigator.userAgent);
    let e = new Audio;
    const d = {
        "audio/webm; codecs=opus": !!e.canPlayType("audio/webm; codecs=opus"),
        "audio/ogg; codecs=opus": !!e.canPlayType("audio/ogg; codecs=opus"),
        "audio/webm; codecs=vorbis": !!e.canPlayType("audio/webm; codecs=vorbis"),
        "audio/ogg; codecs=vorbis": !!e.canPlayType("audio/ogg; codecs=vorbis"),
        "audio/mp4": !!e.canPlayType("audio/mp4"),
        "audio/mpeg": !!e.canPlayType("audio/mpeg")
    };
    e = null;
    const _ = [];
    let p = 0;
    window.RealFile = window.File;
    const i = []
      , y = new Map
      , g = new Map;
    let l = 0;
    const m = [];
    self.runOnStartup = function(e) {
        if ("function" != typeof e)
            throw new Error("runOnStartup called without a function");
        m.push(e)
    }
    ;
    const n = new Set(["cordova", "playable-ad", "instant-games"]);
    window.RuntimeInterface = class e {
        constructor(e) {
            this._useWorker = e.useWorker,
            this._messageChannelPort = null,
            this._baseUrl = "",
            this._scriptFolder = e.scriptFolder,
            this._workerScriptBlobURLs = {},
            this._worker = null,
            this._localRuntime = null,
            this._domHandlers = [],
            this._runtimeDomHandler = null,
            this._canvas = null,
            this._jobScheduler = null,
            this._rafId = -1,
            this._rafFunc = ()=>this._OnRAFCallback(),
            this._rafCallbacks = [],
            this._exportType = e.exportType,
            u(this._exportType) && this._useWorker && (console.warn("[C3 runtime] Worker mode is enabled and supported, but is disabled in WebViews due to crbug.com/923007. Reverting to DOM mode."),
            this._useWorker = !1),
            this._transferablesBroken = !1,
            this._localFileBlobs = null,
            this._localFileStrings = null,
            ("html5" === this._exportType || "playable-ad" === this._exportType) && "file" === location.protocol.substr(0, 4) && alert("Exported games won't work until you upload them. (When running on the file: protocol, browsers block many features from working for security reasons.)"),
            this.AddRuntimeComponentMessageHandler("runtime", "cordova-fetch-local-file", e=>this._OnCordovaFetchLocalFile(e)),
            this.AddRuntimeComponentMessageHandler("runtime", "create-job-worker", e=>this._OnCreateJobWorker(e)),
            "cordova" === this._exportType ? document.addEventListener("deviceready", ()=>this._Init(e)) : this._Init(e)
        }
        Release() {
            this._CancelAnimationFrame(),
            this._messageChannelPort && (this._messageChannelPort.onmessage = null,
            this._messageChannelPort = null),
            this._worker && (this._worker.terminate(),
            this._worker = null),
            this._localRuntime && (this._localRuntime.Release(),
            this._localRuntime = null),
            this._canvas && (this._canvas.parentElement.removeChild(this._canvas),
            this._canvas = null)
        }
        GetCanvas() {
            return this._canvas
        }
        GetBaseURL() {
            return this._baseUrl
        }
        UsesWorker() {
            return this._useWorker
        }
        GetExportType() {
            return this._exportType
        }
        IsiOSCordova() {
            return a && "cordova" === this._exportType
        }
        IsiOSWebView() {
            return a && u(this._exportType)
        }
        async _Init(e) {
            if ("playable-ad" === this._exportType) {
                this._localFileBlobs = self.c3_base64files,
                this._localFileStrings = {},
                await this._ConvertDataUrisToBlobs();
                for (let t = 0, n = e.engineScripts.length; t < n; ++t) {
                    const n = e.engineScripts[t].toLowerCase();
                    this._localFileStrings.hasOwnProperty(n) ? e.engineScripts[t] = {
                        isStringSrc: !0,
                        str: this._localFileStrings[n]
                    } : this._localFileBlobs.hasOwnProperty(n) && (e.engineScripts[t] = URL.createObjectURL(this._localFileBlobs[n]))
                }
            }
            if (e.baseUrl)
                this._baseUrl = e.baseUrl;
            else {
                const e = location.origin;
                this._baseUrl = ("null" === e ? "file:///" : e) + location.pathname;
                const t = this._baseUrl.lastIndexOf("/");
                -1 !== t && (this._baseUrl = this._baseUrl.substr(0, t + 1))
            }
            if (e.workerScripts)
                for (const [t,n] of Object.entries(e.workerScripts))
                    this._workerScriptBlobURLs[t] = URL.createObjectURL(n);
            const t = new MessageChannel;
            this._messageChannelPort = t.port1,
            this._messageChannelPort.onmessage = e=>this._OnMessageFromRuntime(e.data),
            window.c3_addPortMessageHandler && window.c3_addPortMessageHandler(e=>this._OnMessageFromDebugger(e)),
            this._jobScheduler = new self.JobSchedulerDOM(this),
            await this._jobScheduler.Init(),
            this.MaybeForceBodySize(),
            "object" == typeof window.StatusBar && window.StatusBar.hide(),
            "object" == typeof window.AndroidFullScreen && window.AndroidFullScreen.immersiveMode(),
            await this._TestTransferablesWork(),
            this._useWorker ? await this._InitWorker(e, t.port2) : await this._InitDOM(e, t.port2)
        }
        _GetWorkerURL(e) {
            return this._workerScriptBlobURLs.hasOwnProperty(e) ? this._workerScriptBlobURLs[e] : e.endsWith("/workermain.js") && this._workerScriptBlobURLs.hasOwnProperty("workermain.js") ? this._workerScriptBlobURLs["workermain.js"] : "playable-ad" === this._exportType && this._localFileBlobs.hasOwnProperty(e.toLowerCase()) ? URL.createObjectURL(this._localFileBlobs[e.toLowerCase()]) : e
        }
        async CreateWorker(t, n, o) {
            if (t.startsWith("blob:"))
                return new Worker(t,o);
            if (this.IsiOSCordova()) {
                const e = await this.CordovaFetchLocalFileAsArrayBuffer(this._scriptFolder + t)
                  , n = new Blob([e],{
                    type: "application/javascript"
                });
                return new Worker(URL.createObjectURL(n),o)
            }
            const i = new URL(t,n)
              , a = location.origin !== i.origin;
            if (a) {
                const e = await fetch(i);
                if (!e.ok)
                    throw new Error("failed to fetch worker script");
                const t = await e.blob();
                return new Worker(URL.createObjectURL(t),o)
            }
            return new Worker(i,o)
        }
        MaybeForceBodySize() {
            if (this.IsiOSWebView()) {
                const t = document.documentElement.style
                  , n = document.body.style
                  , a = window.innerWidth < window.innerHeight
                  , o = a ? window.screen.width : window.screen.height
                  , i = a ? window.screen.height : window.screen.width;
                n.height = t.height = i + "px",
                n.width = t.width = o + "px"
            }
        }
        _GetCommonRuntimeOptions(t) {
            return {
                baseUrl: this._baseUrl,
                windowInnerWidth: window.innerWidth,
                windowInnerHeight: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio,
                isFullscreen: e.IsDocumentFullscreen(),
                projectData: t.projectData,
                previewImageBlobs: window.cr_previewImageBlobs || this._localFileBlobs,
                previewProjectFileBlobs: window.cr_previewProjectFileBlobs,
                exportType: t.exportType,
                isDebug: -1 < self.location.search.indexOf("debug"),
                ife: !!self.ife,
                jobScheduler: this._jobScheduler.GetPortData(),
                supportedAudioFormats: d,
                opusWasmScriptUrl: window.cr_opusWasmScriptUrl || this._scriptFolder + "opus.wasm.js",
                opusWasmBinaryUrl: window.cr_opusWasmBinaryUrl || this._scriptFolder + "opus.wasm.wasm",
                isiOSCordova: this.IsiOSCordova(),
                isiOSWebView: this.IsiOSWebView(),
                isFBInstantAvailable: "undefined" != typeof self.FBInstant
            }
        }
        async _InitWorker(e, t) {
            const n = this._GetWorkerURL(e.workerMainUrl);
            this._worker = await this.CreateWorker(n, this._baseUrl, {
                name: "Runtime"
            }),
            this._canvas = document.createElement("canvas"),
            this._canvas.style.display = "none";
            const a = this._canvas.transferControlToOffscreen();
            document.body.appendChild(this._canvas),
            window.c3canvas = this._canvas,
            this._worker.postMessage(Object.assign(this._GetCommonRuntimeOptions(e), {
                type: "init-runtime",
                isInWorker: !0,
                messagePort: t,
                canvas: a,
                workerDependencyScripts: e.workerDependencyScripts || [],
                engineScripts: e.engineScripts,
                projectScripts: window.cr_allProjectScripts,
                projectScriptsStatus: self.C3_ProjectScriptsStatus
            }), [t, a, ...this._jobScheduler.GetPortTransferables()]),
            this._domHandlers = i.map(e=>new e(this)),
            this._FindRuntimeDOMHandler(),
            self.c3_callFunction = (e,t)=>this._runtimeDomHandler._InvokeFunctionFromJS(e, t),
            "preview" === this._exportType && (self.goToLastErrorScript = ()=>this.PostToRuntimeComponent("runtime", "go-to-last-error-script"))
        }
        async _InitDOM(n, a) {
            this._canvas = document.createElement("canvas"),
            this._canvas.style.display = "none",
            document.body.appendChild(this._canvas),
            window.c3canvas = this._canvas,
            this._domHandlers = i.map(e=>new e(this)),
            this._FindRuntimeDOMHandler();
            const o = n.engineScripts.map(e=>"string" == typeof e ? new URL(e,this._baseUrl).toString() : e);
            if (Array.isArray(n.workerDependencyScripts) && o.unshift(...n.workerDependencyScripts),
            await Promise.all(o.map(e=>t(e))),
            n.projectScripts && 0 < n.projectScripts.length) {
                const e = self.C3_ProjectScriptsStatus;
                try {
                    if (await Promise.all(n.projectScripts.map(e=>t(e[1]))),
                    Object.values(e).some(e=>!e))
                        return void self.setTimeout(()=>this._ReportProjectScriptError(e), 100)
                } catch (t) {
                    return console.error("[Preview] Error loading project scripts: ", t),
                    void self.setTimeout(()=>this._ReportProjectScriptError(e), 100)
                }
            }
            if ("preview" === this._exportType && "object" != typeof self.C3.ScriptsInEvents)
                return console.error("[C3 runtime] Failed to load JavaScript code used in events. Check all your JavaScript code has valid syntax."),
                void alert("Failed to load JavaScript code used in events. Check all your JavaScript code has valid syntax.");
            const r = Object.assign(this._GetCommonRuntimeOptions(n), {
                isInWorker: !1,
                messagePort: a,
                canvas: this._canvas,
                runOnStartupFunctions: m
            });
            this._localRuntime = self.C3_CreateRuntime(r),
            await self.C3_InitRuntime(this._localRuntime, r)
        }
        _ReportProjectScriptError(e) {
            const t = Object.entries(e).filter(e=>!e[1]).map(e=>e[0])
              , n = `Failed to load project script '${t[0]}'. Check all your JavaScript code has valid syntax.`;
            console.error("[Preview] " + n),
            alert(n)
        }
        async _OnCreateJobWorker() {
            const e = await this._jobScheduler._CreateJobWorker();
            return {
                outputPort: e,
                transferables: [e]
            }
        }
        _GetLocalRuntime() {
            if (this._useWorker)
                throw new Error("not available in worker mode");
            return this._localRuntime
        }
        PostToRuntimeComponent(t, n, a, o, i) {
            this._messageChannelPort.postMessage({
                type: "event",
                component: t,
                handler: n,
                dispatchOpts: o || null,
                data: a,
                responseId: null
            }, this._transferablesBroken ? void 0 : i)
        }
        PostToRuntimeComponentAsync(t, n, a, o, i) {
            const e = l++
              , r = new Promise((t,n)=>{
                g.set(e, {
                    resolve: t,
                    reject: n
                })
            }
            );
            return this._messageChannelPort.postMessage({
                type: "event",
                component: t,
                handler: n,
                dispatchOpts: o || null,
                data: a,
                responseId: e
            }, this._transferablesBroken ? void 0 : i),
            r
        }
        ["_OnMessageFromRuntime"](e) {
            const t = e.type;
            if ("event" === t)
                this._OnEventFromRuntime(e);
            else if ("result" === t)
                this._OnResultFromRuntime(e);
            else if ("runtime-ready" === t)
                this._OnRuntimeReady();
            else if ("alert" === t)
                alert(e.message);
            else
                throw new Error(`unknown message '${t}'`)
        }
        _OnEventFromRuntime(t) {
            const n = t.component
              , o = t.handler
              , a = t.data
              , i = t.responseId
              , e = y.get(n);
            if (!e)
                return void console.warn(`[DOM] No event handlers for component '${n}'`);
            const r = e.get(o);
            if (!r)
                return void console.warn(`[DOM] No handler '${o}' for component '${n}'`);
            let d = null;
            try {
                d = r(a)
            } catch (e) {
                return console.error(`Exception in '${n}' handler '${o}':`, e),
                void (null !== i && this._PostResultToRuntime(i, !1, "" + e))
            }
            null !== i && (d && d.then ? d.then(e=>this._PostResultToRuntime(i, !0, e)).catch(e=>{
                console.error(`Rejection from '${n}' handler '${o}':`, e),
                this._PostResultToRuntime(i, !1, "" + e)
            }
            ) : this._PostResultToRuntime(i, !0, d))
        }
        _PostResultToRuntime(e, t, n) {
            let a;
            n && n.transferables && (a = n.transferables),
            this._messageChannelPort.postMessage({
                type: "result",
                responseId: e,
                isOk: t,
                result: n
            }, a)
        }
        _OnResultFromRuntime(t) {
            const n = t.responseId
              , a = t.isOk
              , o = t.result
              , i = g.get(n);
            a ? i.resolve(o) : i.reject(o),
            g.delete(n)
        }
        AddRuntimeComponentMessageHandler(e, t, n) {
            let a = y.get(e);
            if (a || (a = new Map,
            y.set(e, a)),
            a.has(t))
                throw new Error(`[DOM] Component '${e}' already has handler '${t}'`);
            a.set(t, n)
        }
        static AddDOMHandlerClass(e) {
            if (i.includes(e))
                throw new Error("DOM handler already added");
            i.push(e)
        }
        _FindRuntimeDOMHandler() {
            for (const e of this._domHandlers)
                if ("runtime" === e.GetComponentID())
                    return void (this._runtimeDomHandler = e);
            throw new Error("cannot find runtime DOM handler")
        }
        _OnMessageFromDebugger(e) {
            this.PostToRuntimeComponent("debugger", "message", e)
        }
        _OnRuntimeReady() {
            for (const e of this._domHandlers)
                e.Attach()
        }
        static IsDocumentFullscreen() {
            return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement)
        }
        async GetRemotePreviewStatusInfo() {
            return await this.PostToRuntimeComponentAsync("runtime", "get-remote-preview-status-info")
        }
        _AddRAFCallback(e) {
            this._rafCallbacks.push(e),
            this._RequestAnimationFrame()
        }
        _RemoveRAFCallback(e) {
            const t = this._rafCallbacks.indexOf(e);
            if (-1 === t)
                throw new Error("invalid callback");
            this._rafCallbacks.splice(t, 1),
            this._rafCallbacks.length || this._CancelAnimationFrame()
        }
        _RequestAnimationFrame() {
            -1 === this._rafId && this._rafCallbacks.length && (this._rafId = requestAnimationFrame(this._rafFunc))
        }
        _CancelAnimationFrame() {
            -1 !== this._rafId && (cancelAnimationFrame(this._rafId),
            this._rafId = -1)
        }
        _OnRAFCallback() {
            this._rafId = -1;
            for (const e of this._rafCallbacks)
                e();
            this._RequestAnimationFrame()
        }
        TryPlayMedia(e) {
            this._runtimeDomHandler.TryPlayMedia(e)
        }
        RemovePendingPlay(e) {
            this._runtimeDomHandler.RemovePendingPlay(e)
        }
        _PlayPendingMedia() {
            this._runtimeDomHandler._PlayPendingMedia()
        }
        SetSilent(e) {
            this._runtimeDomHandler.SetSilent(e)
        }
        IsAudioFormatSupported(e) {
            return !!d[e]
        }
        async _WasmDecodeWebMOpus(e) {
            const t = await this.PostToRuntimeComponentAsync("runtime", "opus-decode", {
                arrayBuffer: e
            }, null, [e]);
            return new Float32Array(t)
        }
        IsAbsoluteURL(e) {
            return /^(?:[a-z]+:)?\/\//.test(e) || "data:" === e.substr(0, 5) || "blob:" === e.substr(0, 5)
        }
        IsRelativeURL(e) {
            return !this.IsAbsoluteURL(e)
        }
        async _OnCordovaFetchLocalFile(e) {
            const t = e.filename;
            switch (e.as) {
            case "text":
                return await this.CordovaFetchLocalFileAsText(t);
            case "buffer":
                return await this.CordovaFetchLocalFileAsArrayBuffer(t);
            default:
                throw new Error("unsupported type");
            }
        }
        _GetPermissionAPI() {
            const e = window.cordova && window.cordova.plugins && window.cordova.plugins.permissions;
            if ("object" != typeof e)
                throw new Error("Permission API is not loaded");
            return e
        }
        _MapPermissionID(e, t) {
            const n = e[t];
            if ("string" != typeof n)
                throw new Error("Invalid permission name");
            return n
        }
        _HasPermission(e) {
            const t = this._GetPermissionAPI();
            return new Promise((n,a)=>t.checkPermission(this._MapPermissionID(t, e), e=>n(!!e.hasPermission), a))
        }
        _RequestPermission(e) {
            const t = this._GetPermissionAPI();
            return new Promise((n,a)=>t.requestPermission(this._MapPermissionID(t, e), e=>n(!!e.hasPermission), a))
        }
        async RequestPermissions(e) {
            if ("cordova" !== this.GetExportType())
                return !0;
            if (this.IsiOSCordova())
                return !0;
            for (const t of e) {
                const e = await this._HasPermission(t);
                if (e)
                    continue;
                const n = await this._RequestPermission(t);
                if (!1 === n)
                    return !1
            }
            return !0
        }
        async RequirePermissions(...e) {
            if (!1 === (await this.RequestPermissions(e)))
                throw new Error("Permission not granted")
        }
        CordovaFetchLocalFile(e) {
            const t = window.cordova.file.applicationDirectory + "www/" + e.toLowerCase();
            return new Promise((e,n)=>{
                window.resolveLocalFileSystemURL(t, t=>{
                    t.file(e, n)
                }
                , n)
            }
            )
        }
        async CordovaFetchLocalFileAsText(e) {
            const t = await this.CordovaFetchLocalFile(e);
            return await r(t)
        }
        _CordovaMaybeStartNextArrayBufferRead() {
            if (_.length && !(8 <= p)) {
                p++;
                const e = _.shift();
                this._CordovaDoFetchLocalFileAsAsArrayBuffer(e.filename, e.successCallback, e.errorCallback)
            }
        }
        CordovaFetchLocalFileAsArrayBuffer(e) {
            return new Promise((t,n)=>{
                _.push({
                    filename: e,
                    successCallback: e=>{
                        p--,
                        this._CordovaMaybeStartNextArrayBufferRead(),
                        t(e)
                    }
                    ,
                    errorCallback: e=>{
                        p--,
                        this._CordovaMaybeStartNextArrayBufferRead(),
                        n(e)
                    }
                }),
                this._CordovaMaybeStartNextArrayBufferRead()
            }
            )
        }
        async _CordovaDoFetchLocalFileAsAsArrayBuffer(t, n, e) {
            try {
                const a = await this.CordovaFetchLocalFile(t)
                  , o = await s(a);
                n(o)
            } catch (t) {
                e(t)
            }
        }
        async _ConvertDataUrisToBlobs() {
            const e = [];
            for (const [t,n] of Object.entries(this._localFileBlobs))
                e.push(this._ConvertDataUriToBlobs(t, n));
            await Promise.all(e)
        }
        async _ConvertDataUriToBlobs(e, t) {
            if ("object" == typeof t)
                this._localFileBlobs[e] = new Blob([t.str],{
                    type: t.type
                }),
                this._localFileStrings[e] = t.str;
            else {
                let n = await this._FetchDataUri(t);
                n || (n = this._DataURIToBinaryBlobSync(t)),
                this._localFileBlobs[e] = n
            }
        }
        async _FetchDataUri(e) {
            try {
                const t = await fetch(e);
                return await t.blob()
            } catch (e) {
                return console.warn("Failed to fetch a data: URI. Falling back to a slower workaround. This is probably because the Content Security Policy unnecessarily blocked it. Allow data: URIs in your CSP to avoid this.", e),
                null
            }
        }
        _DataURIToBinaryBlobSync(e) {
            const t = this._ParseDataURI(e);
            return this._BinaryStringToBlob(t.data, t.mime_type)
        }
        _ParseDataURI(t) {
            const n = t.indexOf(",");
            if (0 > n)
                throw new URIError("expected comma in data: uri");
            const a = t.substring(5, n)
              , o = t.substring(n + 1)
              , r = a.split(";")
              , e = r[0] || ""
              , d = r[1]
              , s = r[2];
            let u;
            return u = "base64" === d || "base64" === s ? atob(o) : decodeURIComponent(o),
            {
                mime_type: e,
                data: u
            }
        }
        _BinaryStringToBlob(t, n) {
            let a, o, i = t.length, e = i >> 2, r = new Uint8Array(i), s = new Uint32Array(r.buffer,0,e);
            for (a = 0,
            o = 0; a < e; ++a)
                s[a] = t.charCodeAt(o++) | t.charCodeAt(o++) << 8 | t.charCodeAt(o++) << 16 | t.charCodeAt(o++) << 24;
            for (let e = 3 & i; e--; )
                r[o] = t.charCodeAt(o),
                ++o;
            return new Blob([r],{
                type: n
            })
        }
        _TestTransferablesWork() {
            let e = null;
            const t = new Promise(t=>e = t)
              , n = new ArrayBuffer(1)
              , o = new MessageChannel;
            return o.port2.onmessage = t=>{
                t.data && t.data.arrayBuffer || (this._transferablesBroken = !0,
                console.warn("MessageChannel transfers determined to be broken. Disabling transferables.")),
                e()
            }
            ,
            o.port1.postMessage({
                arrayBuffer: n
            }, [n]),
            t
        }
    }
}
{
    function t(e) {
        return e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents || e.originalEvent && e.originalEvent.sourceCapabilities && e.originalEvent.sourceCapabilities.firesTouchEvents
    }
    function s(e) {
        return new Promise((t,n)=>{
            const a = document.createElement("link");
            a.onload = ()=>t(a),
            a.onerror = e=>n(e),
            a.rel = "stylesheet",
            a.href = e,
            document.head.appendChild(a)
        }
        )
    }
    function a(e) {
        return new Promise((t,n)=>{
            const a = new Image;
            a.onload = ()=>t(a),
            a.onerror = e=>n(e),
            a.src = e
        }
        )
    }
    async function u(e) {
        const t = URL.createObjectURL(e);
        try {
            return await a(t)
        } finally {
            URL.revokeObjectURL(t)
        }
    }
    function d(e) {
        return new Promise((t,n)=>{
            let a = new FileReader;
            a.onload = e=>t(e.target.result),
            a.onerror = e=>n(e),
            a.readAsText(e)
        }
        )
    }
    async function _(e, t, n) {
        if (!/firefox/i.test(navigator.userAgent))
            return await u(e);
        let o = await d(e);
        const r = new DOMParser
          , s = r.parseFromString(o, "image/svg+xml")
          , l = s.documentElement;
        if (l.hasAttribute("width") && l.hasAttribute("height")) {
            const t = l.getAttribute("width")
              , n = l.getAttribute("height");
            if (!t.includes("%") && !n.includes("%"))
                return await u(e)
        }
        l.setAttribute("width", t + "px"),
        l.setAttribute("height", n + "px");
        const i = new XMLSerializer;
        return o = i.serializeToString(s),
        e = new Blob([o],{
            type: "image/svg+xml"
        }),
        await u(e)
    }
    function e(e) {
        do {
            if (e.parentNode && e.hasAttribute("contenteditable"))
                return !0;
            e = e.parentNode
        } while (e);
        return !1
    }
    function f(e) {
        const t = e.target.tagName.toLowerCase();
        o.has(t) && e.preventDefault()
    }
    function g(e) {
        (e.metaKey || e.ctrlKey) && e.preventDefault()
    }
    function i() {
        try {
            return window.parent && window.parent.document.hasFocus()
        } catch (e) {
            return !1
        }
    }
    function c() {
        const t = document.activeElement;
        if (!t)
            return !1;
        const n = t.tagName.toLowerCase()
          , a = new Set(["email", "number", "password", "search", "tel", "text", "url"]);
        return "textarea" === n || ("input" === n ? a.has(t.type.toLowerCase() || "text") : e(t))
    }
    const y = new Map([["OSLeft", "MetaLeft"], ["OSRight", "MetaRight"]])
      , l = {
        dispatchRuntimeEvent: !0,
        dispatchUserScriptEvent: !0
    }
      , m = {
        dispatchUserScriptEvent: !0
    }
      , n = {
        dispatchRuntimeEvent: !0
    }
      , o = new Set(["canvas", "body", "html"]);
    self.C3_GetSvgImageSize = async function(e) {
        const t = await u(e);
        if (0 < t.width && 0 < t.height)
            return [t.width, t.height];
        else {
            t.style.position = "absolute",
            t.style.left = "0px",
            t.style.top = "0px",
            t.style.visibility = "hidden",
            document.body.appendChild(t);
            const e = t.getBoundingClientRect();
            return document.body.removeChild(t),
            [e.width, e.height]
        }
    }
    ,
    self.C3_RasterSvgImageBlob = async function(t, n, a, o, r) {
        const e = await _(t, n, a)
          , d = document.createElement("canvas");
        d.width = o,
        d.height = r;
        const s = d.getContext("2d");
        return s.drawImage(e, 0, 0, n, a),
        d
    }
    ;
    let p = !1;
    document.addEventListener("pause", ()=>p = !0),
    document.addEventListener("resume", ()=>p = !1);
    const b = class extends DOMHandler {
        constructor(t) {
            super(t, "runtime"),
            this._isFirstSizeUpdate = !0,
            this._simulatedResizeTimerId = -1,
            this._targetOrientation = "any",
            this._attachedDeviceOrientationEvent = !1,
            this._attachedDeviceMotionEvent = !1,
            this._debugHighlightElem = null,
            this._pointerRawUpdateRateLimiter = null,
            this._lastPointerRawUpdateEvent = null,
            t.AddRuntimeComponentMessageHandler("canvas", "update-size", e=>this._OnUpdateCanvasSize(e)),
            t.AddRuntimeComponentMessageHandler("runtime", "invoke-download", e=>this._OnInvokeDownload(e)),
            t.AddRuntimeComponentMessageHandler("runtime", "raster-svg-image", e=>this._OnRasterSvgImage(e)),
            t.AddRuntimeComponentMessageHandler("runtime", "get-svg-image-size", e=>this._OnGetSvgImageSize(e)),
            t.AddRuntimeComponentMessageHandler("runtime", "set-target-orientation", e=>this._OnSetTargetOrientation(e)),
            t.AddRuntimeComponentMessageHandler("runtime", "register-sw", ()=>this._OnRegisterSW()),
            t.AddRuntimeComponentMessageHandler("runtime", "post-to-debugger", e=>this._OnPostToDebugger(e)),
            t.AddRuntimeComponentMessageHandler("runtime", "go-to-script", e=>this._OnPostToDebugger(e)),
            t.AddRuntimeComponentMessageHandler("runtime", "before-start-ticking", ()=>this._OnBeforeStartTicking()),
            t.AddRuntimeComponentMessageHandler("runtime", "debug-highlight", e=>this._OnDebugHighlight(e)),
            t.AddRuntimeComponentMessageHandler("runtime", "enable-device-orientation", ()=>this._AttachDeviceOrientationEvent()),
            t.AddRuntimeComponentMessageHandler("runtime", "enable-device-motion", ()=>this._AttachDeviceMotionEvent()),
            t.AddRuntimeComponentMessageHandler("runtime", "add-stylesheet", e=>this._OnAddStylesheet(e)),
            t.AddRuntimeComponentMessageHandler("runtime", "alert", e=>this._OnAlert(e));
            const n = new Set(["input", "textarea", "datalist"]);
            window.addEventListener("contextmenu", t=>{
                const a = t.target
                  , o = a.tagName.toLowerCase();
                n.has(o) || e(a) || t.preventDefault()
            }
            );
            const a = t.GetCanvas();
            window.addEventListener("selectstart", f),
            window.addEventListener("gesturehold", f),
            a.addEventListener("selectstart", f),
            a.addEventListener("gesturehold", f),
            window.addEventListener("touchstart", f, {
                passive: !1
            }),
            "undefined" == typeof PointerEvent ? a.addEventListener("touchstart", f) : (window.addEventListener("pointerdown", f, {
                passive: !1
            }),
            a.addEventListener("pointerdown", f)),
            this._mousePointerLastButtons = 0,
            window.addEventListener("mousedown", e=>{
                1 === e.button && e.preventDefault()
            }
            ),
            window.addEventListener("mousewheel", g, {
                passive: !1
            }),
            window.addEventListener("wheel", g, {
                passive: !1
            }),
            window.addEventListener("resize", ()=>this._OnWindowResize()),
            t.IsiOSWebView() && window.addEventListener("focusout", ()=>{
                c() || (document.scrollingElement.scrollTop = 0)
            }
            ),
            this._mediaPendingPlay = new Set,
            this._mediaRemovedPendingPlay = new WeakSet,
            this._isSilent = !1
        }
        _OnBeforeStartTicking() {
            return "cordova" === this._iRuntime.GetExportType() ? (document.addEventListener("pause", ()=>this._OnVisibilityChange(!0)),
            document.addEventListener("resume", ()=>this._OnVisibilityChange(!1))) : document.addEventListener("visibilitychange", ()=>this._OnVisibilityChange(document.hidden)),
            {
                isSuspended: !!(document.hidden || p)
            }
        }
        Attach() {
            window.addEventListener("focus", ()=>this._PostRuntimeEvent("window-focus")),
            window.addEventListener("blur", ()=>{
                this._PostRuntimeEvent("window-blur", {
                    parentHasFocus: i()
                }),
                this._mousePointerLastButtons = 0
            }
            ),
            window.addEventListener("fullscreenchange", ()=>this._OnFullscreenChange()),
            window.addEventListener("webkitfullscreenchange", ()=>this._OnFullscreenChange()),
            window.addEventListener("mozfullscreenchange", ()=>this._OnFullscreenChange()),
            window.addEventListener("fullscreenerror", e=>this._OnFullscreenError(e)),
            window.addEventListener("webkitfullscreenerror", e=>this._OnFullscreenError(e)),
            window.addEventListener("mozfullscreenerror", e=>this._OnFullscreenError(e)),
            window.addEventListener("keydown", e=>this._OnKeyEvent("keydown", e)),
            window.addEventListener("keyup", e=>this._OnKeyEvent("keyup", e)),
            window.addEventListener("dblclick", e=>this._OnMouseEvent("dblclick", e, l)),
            window.addEventListener("wheel", e=>this._OnMouseWheelEvent("wheel", e)),
            "undefined" == typeof PointerEvent ? (window.addEventListener("mousedown", e=>this._OnMouseEventAsPointer("pointerdown", e)),
            window.addEventListener("mousemove", e=>this._OnMouseEventAsPointer("pointermove", e)),
            window.addEventListener("mouseup", e=>this._OnMouseEventAsPointer("pointerup", e)),
            window.addEventListener("touchstart", e=>this._OnTouchEvent("pointerdown", e)),
            window.addEventListener("touchmove", e=>this._OnTouchEvent("pointermove", e)),
            window.addEventListener("touchend", e=>this._OnTouchEvent("pointerup", e)),
            window.addEventListener("touchcancel", e=>this._OnTouchEvent("pointercancel", e))) : (window.addEventListener("pointerdown", e=>this._OnPointerEvent("pointerdown", e)),
            this._iRuntime.UsesWorker() && "undefined" != typeof window.onpointerrawupdate && self === self.top ? (this._pointerRawUpdateRateLimiter = new RateLimiter(()=>this._DoSendPointerRawUpdate(),5),
            this._pointerRawUpdateRateLimiter.SetCanRunImmediate(!0),
            window.addEventListener("pointerrawupdate", e=>this._OnPointerRawUpdate(e))) : window.addEventListener("pointermove", e=>this._OnPointerEvent("pointermove", e)),
            window.addEventListener("pointerup", e=>this._OnPointerEvent("pointerup", e)),
            window.addEventListener("pointercancel", e=>this._OnPointerEvent("pointercancel", e)));
            const e = ()=>this._PlayPendingMedia();
            window.addEventListener("pointerup", e, !0),
            window.addEventListener("touchend", e, !0),
            window.addEventListener("click", e, !0),
            window.addEventListener("keydown", e, !0),
            window.addEventListener("gamepadconnected", e, !0)
        }
        _PostRuntimeEvent(e, t) {
            this.PostToRuntime(e, t || null, n)
        }
        _GetWindowInnerWidth() {
            return Math.max(window.innerWidth, 1)
        }
        _GetWindowInnerHeight() {
            return Math.max(window.innerHeight, 1)
        }
        _OnWindowResize() {
            const e = this._GetWindowInnerWidth()
              , t = this._GetWindowInnerHeight();
            this._PostRuntimeEvent("window-resize", {
                innerWidth: e,
                innerHeight: t,
                devicePixelRatio: window.devicePixelRatio
            }),
            this._iRuntime.IsiOSWebView() && (-1 !== this._simulatedResizeTimerId && clearTimeout(this._simulatedResizeTimerId),
            this._OnSimulatedResize(e, t, 0))
        }
        _ScheduleSimulatedResize(e, t, n) {
            -1 !== this._simulatedResizeTimerId && clearTimeout(this._simulatedResizeTimerId),
            this._simulatedResizeTimerId = setTimeout(()=>this._OnSimulatedResize(e, t, n), 48)
        }
        _OnSimulatedResize(t, n, a) {
            const o = this._GetWindowInnerWidth()
              , i = this._GetWindowInnerHeight();
            this._simulatedResizeTimerId = -1,
            o != t || i != n ? this._PostRuntimeEvent("window-resize", {
                innerWidth: o,
                innerHeight: i,
                devicePixelRatio: window.devicePixelRatio
            }) : 10 > a && this._ScheduleSimulatedResize(o, i, a + 1)
        }
        _OnSetTargetOrientation(e) {
            this._targetOrientation = e.targetOrientation
        }
        _TrySetTargetOrientation() {
            const e = this._targetOrientation;
            if (screen.orientation && screen.orientation.lock)
                screen.orientation.lock(e).catch(e=>console.warn("[Construct 3] Failed to lock orientation: ", e));
            else
                try {
                    let t = !1;
                    screen.lockOrientation ? t = screen.lockOrientation(e) : screen.webkitLockOrientation ? t = screen.webkitLockOrientation(e) : screen.mozLockOrientation ? t = screen.mozLockOrientation(e) : screen.msLockOrientation && (t = screen.msLockOrientation(e)),
                    t || console.warn("[Construct 3] Failed to lock orientation")
                } catch (e) {
                    console.warn("[Construct 3] Failed to lock orientation: ", e)
                }
        }
        _OnFullscreenChange() {
            const e = RuntimeInterface.IsDocumentFullscreen();
            e && "any" !== this._targetOrientation && this._TrySetTargetOrientation(),
            this.PostToRuntime("fullscreenchange", {
                isFullscreen: e,
                innerWidth: this._GetWindowInnerWidth(),
                innerHeight: this._GetWindowInnerHeight()
            })
        }
        _OnFullscreenError(e) {
            console.warn("[Construct 3] Fullscreen request failed: ", e),
            this.PostToRuntime("fullscreenerror", {
                isFullscreen: RuntimeInterface.IsDocumentFullscreen(),
                innerWidth: this._GetWindowInnerWidth(),
                innerHeight: this._GetWindowInnerHeight()
            })
        }
        _OnVisibilityChange(e) {
            e ? this._iRuntime._CancelAnimationFrame() : this._iRuntime._RequestAnimationFrame(),
            this.PostToRuntime("visibilitychange", {
                hidden: e
            })
        }
        _OnKeyEvent(e, t) {
            "Backspace" === t.key && f(t);
            const n = y.get(t.code) || t.code;
            this._PostToRuntimeMaybeSync(e, {
                code: n,
                key: t.key,
                which: t.which,
                repeat: t.repeat,
                altKey: t.altKey,
                ctrlKey: t.ctrlKey,
                metaKey: t.metaKey,
                shiftKey: t.shiftKey,
                timeStamp: t.timeStamp
            }, l)
        }
        _OnMouseWheelEvent(e, t) {
            this.PostToRuntime(e, {
                clientX: t.clientX,
                clientY: t.clientY,
                deltaX: t.deltaX,
                deltaY: t.deltaY,
                deltaZ: t.deltaZ,
                deltaMode: t.deltaMode,
                timeStamp: t.timeStamp
            }, l)
        }
        _OnMouseEvent(e, n, a) {
            t(n) || ("mousedown" === e && window !== window.top && window.focus(),
            this._PostToRuntimeMaybeSync(e, {
                button: n.button,
                buttons: n.buttons,
                clientX: n.clientX,
                clientY: n.clientY,
                timeStamp: n.timeStamp
            }, a))
        }
        _OnMouseEventAsPointer(e, n) {
            if (!t(n)) {
                "pointerdown" === e && window !== window.top && window.focus();
                const t = this._mousePointerLastButtons;
                "pointerdown" === e && 0 !== t ? e = "pointermove" : "pointerup" == e && 0 !== n.buttons && (e = "pointermove"),
                this._PostToRuntimeMaybeSync(e, {
                    pointerId: 1,
                    pointerType: "mouse",
                    button: n.button,
                    buttons: n.buttons,
                    lastButtons: t,
                    clientX: n.clientX,
                    clientY: n.clientY,
                    width: 0,
                    height: 0,
                    pressure: 0,
                    tangentialPressure: 0,
                    tiltX: 0,
                    tiltY: 0,
                    twist: 0,
                    timeStamp: n.timeStamp
                }, l),
                this._mousePointerLastButtons = n.buttons,
                this._OnMouseEvent(n.type, n, m)
            }
        }
        _OnPointerEvent(e, t) {
            "pointerdown" === e && window !== window.top && window.focus(),
            this._pointerRawUpdateRateLimiter && "pointermove" !== e && this._pointerRawUpdateRateLimiter.Reset();
            let n = 0;
            if ("mouse" === t.pointerType && (n = this._mousePointerLastButtons),
            this._PostToRuntimeMaybeSync(e, {
                pointerId: t.pointerId,
                pointerType: t.pointerType,
                button: t.button,
                buttons: t.buttons,
                lastButtons: n,
                clientX: t.clientX,
                clientY: t.clientY,
                width: t.width || 0,
                height: t.height || 0,
                pressure: t.pressure || 0,
                tangentialPressure: t.tangentialPressure || 0,
                tiltX: t.tiltX || 0,
                tiltY: t.tiltY || 0,
                twist: t.twist || 0,
                timeStamp: t.timeStamp
            }, l),
            "mouse" === t.pointerType) {
                let n = "mousemove";
                "pointerdown" === e ? n = "mousedown" : "pointerup" == e && (n = "pointerup"),
                this._OnMouseEvent(n, t, m),
                this._mousePointerLastButtons = t.buttons
            }
        }
        _OnPointerRawUpdate(e) {
            this._lastPointerRawUpdateEvent = e,
            this._pointerRawUpdateRateLimiter.Call()
        }
        _DoSendPointerRawUpdate() {
            this._OnPointerEvent("pointermove", this._lastPointerRawUpdateEvent),
            this._lastPointerRawUpdateEvent = null
        }
        _OnTouchEvent(e, t) {
            "pointerdown" === e && window !== window.top && window.focus();
            for (let n = 0, a = t.changedTouches.length; n < a; ++n) {
                const a = t.changedTouches[n];
                this._PostToRuntimeMaybeSync(e, {
                    pointerId: a.identifier,
                    pointerType: "touch",
                    button: 0,
                    buttons: 0,
                    lastButtons: 0,
                    clientX: a.clientX,
                    clientY: a.clientY,
                    width: 2 * (a.radiusX || a.webkitRadiusX || 0),
                    height: 2 * (a.radiusY || a.webkitRadiusY || 0),
                    pressure: a.force || a.webkitForce || 0,
                    tangentialPressure: 0,
                    tiltX: 0,
                    tiltY: 0,
                    twist: a.rotationAngle || 0,
                    timeStamp: t.timeStamp
                }, l)
            }
        }
        _AttachDeviceOrientationEvent() {
            this._attachedDeviceOrientationEvent || (this._attachedDeviceOrientationEvent = !0,
            window.addEventListener("deviceorientation", e=>this._OnDeviceOrientation(e)))
        }
        _AttachDeviceMotionEvent() {
            this._attachedDeviceMotionEvent || (this._attachedDeviceMotionEvent = !0,
            window.addEventListener("devicemotion", e=>this._OnDeviceMotion(e)))
        }
        _OnDeviceOrientation(e) {
            this.PostToRuntime("deviceorientation", {
                alpha: e.alpha || 0,
                beta: e.beta || 0,
                gamma: e.gamma || 0,
                timeStamp: e.timeStamp
            }, l)
        }
        _OnDeviceMotion(t) {
            let n = null;
            const a = t.acceleration;
            a && (n = {
                x: a.x || 0,
                y: a.y || 0,
                z: a.z || 0
            });
            let o = null;
            const i = t.accelerationIncludingGravity;
            i && (o = {
                x: i.x || 0,
                y: i.y || 0,
                z: i.z || 0
            });
            let e = null;
            const r = t.rotationRate;
            r && (e = {
                alpha: r.alpha || 0,
                beta: r.beta || 0,
                gamma: r.gamma || 0
            }),
            this.PostToRuntime("devicemotion", {
                acceleration: n,
                accelerationIncludingGravity: o,
                rotationRate: e,
                interval: t.interval,
                timeStamp: t.timeStamp
            }, l)
        }
        _OnUpdateCanvasSize(e) {
            const t = this.GetRuntimeInterface()
              , n = t.GetCanvas();
            n.style.width = e.styleWidth + "px",
            n.style.height = e.styleHeight + "px",
            n.style.marginLeft = e.marginLeft + "px",
            n.style.marginTop = e.marginTop + "px",
            t.MaybeForceBodySize(),
            this._isFirstSizeUpdate && (n.style.display = "",
            this._isFirstSizeUpdate = !1)
        }
        _OnInvokeDownload(t) {
            const n = t.url
              , o = t.filename
              , i = document.createElement("a")
              , e = document.body;
            i.textContent = o,
            i.href = n,
            i.download = o,
            e.appendChild(i),
            i.click(),
            e.removeChild(i)
        }
        async _OnRasterSvgImage(t) {
            const n = t.blob
              , a = t.imageWidth
              , o = t.imageHeight
              , r = t.surfaceWidth
              , e = t.surfaceHeight
              , d = t.imageBitmapOpts
              , s = await self.C3_RasterSvgImageBlob(n, a, o, r, e);
            let u;
            return u = d ? await createImageBitmap(s, d) : await createImageBitmap(s),
            {
                imageBitmap: u,
                transferables: [u]
            }
        }
        async _OnGetSvgImageSize(e) {
            return await self.C3_GetSvgImageSize(e.blob)
        }
        async _OnAddStylesheet(e) {
            await s(e.url)
        }
        _PlayPendingMedia() {
            const e = [...this._mediaPendingPlay];
            if (this._mediaPendingPlay.clear(),
            !this._isSilent)
                for (const t of e) {
                    const e = t.play();
                    e && e.catch(()=>{
                        this._mediaRemovedPendingPlay.has(t) || this._mediaPendingPlay.add(t)
                    }
                    )
                }
        }
        TryPlayMedia(e) {
            if ("function" != typeof e.play)
                throw new Error("missing play function");
            this._mediaRemovedPendingPlay.delete(e);
            let t;
            try {
                t = e.play()
            } catch (t) {
                return void this._mediaPendingPlay.add(e)
            }
            t && t.catch(()=>{
                this._mediaRemovedPendingPlay.has(e) || this._mediaPendingPlay.add(e)
            }
            )
        }
        RemovePendingPlay(e) {
            this._mediaPendingPlay.delete(e),
            this._mediaRemovedPendingPlay.add(e)
        }
        SetSilent(e) {
            this._isSilent = !!e
        }
        _OnDebugHighlight(e) {
            const t = e.show;
            if (!t)
                return void (this._debugHighlightElem && (this._debugHighlightElem.style.display = "none"));
            this._debugHighlightElem || (this._debugHighlightElem = document.createElement("div"),
            this._debugHighlightElem.id = "inspectOutline",
            document.body.appendChild(this._debugHighlightElem));
            const n = this._debugHighlightElem;
            n.style.display = "",
            n.style.left = e.left - 1 + "px",
            n.style.top = e.top - 1 + "px",
            n.style.width = e.width + 2 + "px",
            n.style.height = e.height + 2 + "px",
            n.textContent = e.name
        }
        _OnRegisterSW() {
            window.C3_RegisterSW && window.C3_RegisterSW()
        }
        _OnPostToDebugger(e) {
            window.c3_postToMessagePort && (e.from = "runtime",
            window.c3_postToMessagePort(e))
        }
        _InvokeFunctionFromJS(e, t) {
            return this.PostToRuntimeAsync("js-invoke-function", {
                name: e,
                params: t
            })
        }
        _OnAlert(e) {
            alert(e.message + " [via Web Worker]")
        }
    }
    ;
    RuntimeInterface.AddDOMHandlerClass(b)
}
{
    const e = document.currentScript.src;
    self.JobSchedulerDOM = class {
        constructor(t) {
            this._runtimeInterface = t,
            this._baseUrl = e ? e.substr(0, e.lastIndexOf("/") + 1) : t.GetBaseURL(),
            this._maxNumWorkers = Math.min(navigator.hardwareConcurrency || 2, 16),
            this._dispatchWorker = null,
            this._jobWorkers = [],
            this._inputPort = null,
            this._outputPort = null
        }
        async Init() {
            if (this._hasInitialised)
                throw new Error("already initialised");
            this._hasInitialised = !0;
            const e = this._runtimeInterface._GetWorkerURL("dispatchworker.js");
            this._dispatchWorker = await this._runtimeInterface.CreateWorker(e, this._baseUrl, {
                name: "DispatchWorker"
            });
            const t = new MessageChannel;
            this._inputPort = t.port1,
            this._dispatchWorker.postMessage({
                type: "_init",
                "in-port": t.port2
            }, [t.port2]),
            this._outputPort = await this._CreateJobWorker()
        }
        async _CreateJobWorker() {
            const t = this._jobWorkers.length
              , n = this._runtimeInterface._GetWorkerURL("jobworker.js")
              , a = await this._runtimeInterface.CreateWorker(n, this._baseUrl, {
                name: "JobWorker" + t
            })
              , o = new MessageChannel
              , i = new MessageChannel;
            return this._dispatchWorker.postMessage({
                type: "_addJobWorker",
                port: o.port1
            }, [o.port1]),
            a.postMessage({
                type: "init",
                number: t,
                "dispatch-port": o.port2,
                "output-port": i.port2
            }, [o.port2, i.port2]),
            this._jobWorkers.push(a),
            i.port1
        }
        GetPortData() {
            return {
                inputPort: this._inputPort,
                outputPort: this._outputPort,
                maxNumWorkers: this._maxNumWorkers
            }
        }
        GetPortTransferables() {
            return [this._inputPort, this._outputPort]
        }
    }
}
if ("use strict",
window.C3_IsSupported) {
    "undefined" != typeof OffscreenCanvas;
    window.c3_runtimeInterface = new RuntimeInterface({
        useWorker: !1,
        workerMainUrl: "workermain.js",
        engineScripts: ["scripts/c3runtime.js"],
        scriptFolder: "scripts/",
        workerDependencyScripts: [],
        exportType: "html5"
    })
}
{
    function e(e, t) {
        return e.length === t.length && (e === t || e.toLowerCase() === t.toLowerCase())
    }
    const t = class extends DOMHandler {
        constructor(e) {
            super(e, "audio"),
            this._audioContext = null,
            this._destinationNode = null,
            this._hasUnblocked = !1,
            this._unblockFunc = ()=>this._UnblockAudioContext(),
            this._audioBuffers = [],
            this._audioInstances = [],
            this._lastAudioInstance = null,
            this._lastPlayedTag = "",
            this._lastTickCount = -1,
            this._pendingTags = new Map,
            this._masterVolume = 1,
            this._isSilent = !1,
            this._timeScaleMode = 0,
            this._timeScale = 1,
            this._gameTime = 0,
            this._panningModel = "HRTF",
            this._distanceModel = "inverse",
            this._refDistance = 600,
            this._maxDistance = 1e4,
            this._rolloffFactor = 1,
            this._playMusicAsSound = !1,
            this._hasAnySoftwareDecodedMusic = !1,
            this._supportsWebMOpus = this._iRuntime.IsAudioFormatSupported("audio/webm; codecs=opus"),
            this._effects = new Map,
            this._analysers = new Set,
            this._isPendingPostFxState = !1,
            this._microphoneTag = "",
            this._microphoneSource = null,
            self.C3Audio_OnMicrophoneStream = (e,t)=>this._OnMicrophoneStream(e, t),
            this._destMediaStreamNode = null,
            self.C3Audio_GetOutputStream = ()=>this._OnGetOutputStream(),
            self.C3Audio_DOMInterface = this,
            this.AddRuntimeMessageHandlers([["create-audio-context", e=>this._CreateAudioContext(e)], ["play", e=>this._Play(e)], ["stop", e=>this._Stop(e)], ["stop-all", ()=>this._StopAll()], ["set-paused", e=>this._SetPaused(e)], ["set-volume", e=>this._SetVolume(e)], ["fade-volume", e=>this._FadeVolume(e)], ["set-master-volume", e=>this._SetMasterVolume(e)], ["set-muted", e=>this._SetMuted(e)], ["set-silent", e=>this._SetSilent(e)], ["set-looping", e=>this._SetLooping(e)], ["set-playback-rate", e=>this._SetPlaybackRate(e)], ["seek", e=>this._Seek(e)], ["preload", e=>this._Preload(e)], ["unload", e=>this._Unload(e)], ["unload-all", ()=>this._UnloadAll()], ["set-suspended", e=>this._SetSuspended(e)], ["add-effect", e=>this._AddEffect(e)], ["set-effect-param", e=>this._SetEffectParam(e)], ["remove-effects", e=>this._RemoveEffects(e)], ["tick", e=>this._OnTick(e)], ["load-state", e=>this._OnLoadState(e)]])
        }
        async _CreateAudioContext(e) {
            e.isiOSCordova && (this._playMusicAsSound = !0),
            this._timeScaleMode = e.timeScaleMode,
            this._panningModel = ["equalpower", "HRTF", "soundfield"][e.panningModel],
            this._distanceModel = ["linear", "inverse", "exponential"][e.distanceModel],
            this._refDistance = e.refDistance,
            this._maxDistance = e.maxDistance,
            this._rolloffFactor = e.rolloffFactor;
            const t = {
                latencyHint: e.latencyHint
            };
            if ("undefined" != typeof AudioContext)
                this._audioContext = new AudioContext(t);
            else if ("undefined" != typeof webkitAudioContext)
                this._audioContext = new webkitAudioContext(t);
            else
                throw new Error("Web Audio API not supported");
            this._destinationNode = this._audioContext.createGain(),
            this._destinationNode.connect(this._audioContext.destination);
            const n = e.listenerPos;
            this._audioContext.listener.setPosition(n[0], n[1], n[2]),
            this._audioContext.listener.setOrientation(0, 0, 1, 0, -1, 0),
            window.addEventListener("pointerup", this._unblockFunc, !0),
            window.addEventListener("touchend", this._unblockFunc, !0),
            window.addEventListener("click", this._unblockFunc, !0),
            window.addEventListener("keydown", this._unblockFunc, !0),
            self.C3_GetAudioContextCurrentTime = ()=>this.GetAudioCurrentTime();
            try {
                await Promise.all(e.preloadList.map(e=>this._GetAudioBuffer(e.originalUrl, e.url, e.type, !1)))
            } catch (e) {
                console.error("[Construct 3] Preloading sounds failed: ", e)
            }
            return {
                sampleRate: this._audioContext.sampleRate
            }
        }
        _UnblockAudioContext() {
            if (!this._hasUnblocked) {
                const e = this._audioContext;
                "suspended" === e.state && e.resume && e.resume();
                const t = e.createBuffer(1, 220, 22050)
                  , n = e.createBufferSource();
                n.buffer = t,
                n.connect(e.destination),
                n.start(0),
                "running" === e.state && (this._hasUnblocked = !0,
                window.removeEventListener("pointerup", this._unblockFunc, !0),
                window.removeEventListener("touchend", this._unblockFunc, !0),
                window.removeEventListener("click", this._unblockFunc, !0),
                window.removeEventListener("keydown", this._unblockFunc, !0),
                this._unblockFunc = null)
            }
        }
        GetAudioContext() {
            return this._audioContext
        }
        GetAudioCurrentTime() {
            return this._audioContext.currentTime
        }
        GetDestinationNode() {
            return this._destinationNode
        }
        GetDestinationForTag(e) {
            const t = this._effects.get(e.toLowerCase());
            return t ? t[0].GetInputNode() : this.GetDestinationNode()
        }
        AddEffectForTag(e, t) {
            e = e.toLowerCase();
            let n = this._effects.get(e);
            n || (n = [],
            this._effects.set(e, n)),
            t._SetIndex(n.length),
            t._SetTag(e),
            n.push(t),
            this._ReconnectEffects(e)
        }
        _ReconnectEffects(e) {
            let t = this.GetDestinationNode();
            const n = this._effects.get(e);
            if (n && n.length) {
                t = n[0].GetInputNode();
                for (let e = 0, t = n.length; e < t; ++e) {
                    const a = n[e];
                    e + 1 === t ? a.ConnectTo(this.GetDestinationNode()) : a.ConnectTo(n[e + 1].GetInputNode())
                }
            }
            for (const n of this.audioInstancesByTag(e))
                n.Reconnect(t);
            this._microphoneSource && this._microphoneTag === e && (this._microphoneSource.disconnect(),
            this._microphoneSource.connect(t))
        }
        GetMasterVolume() {
            return this._masterVolume
        }
        IsSilent() {
            return this._isSilent
        }
        GetTimeScaleMode() {
            return this._timeScaleMode
        }
        GetTimeScale() {
            return this._timeScale
        }
        GetGameTime() {
            return this._gameTime
        }
        IsPlayMusicAsSound() {
            return this._playMusicAsSound
        }
        SupportsWebMOpus() {
            return this._supportsWebMOpus
        }
        _SetHasAnySoftwareDecodedMusic() {
            this._hasAnySoftwareDecodedMusic = !0
        }
        GetPanningModel() {
            return this._panningModel
        }
        GetDistanceModel() {
            return this._distanceModel
        }
        GetReferenceDistance() {
            return this._refDistance
        }
        GetMaxDistance() {
            return this._maxDistance
        }
        GetRolloffFactor() {
            return this._rolloffFactor
        }
        DecodeAudioData(e, t) {
            return t ? this._iRuntime._WasmDecodeWebMOpus(e).then(e=>{
                const t = this._audioContext.createBuffer(1, e.length, 48e3)
                  , n = t.getChannelData(0);
                return n.set(e),
                t
            }
            ) : new Promise((t,n)=>{
                this._audioContext.decodeAudioData(e, t, n)
            }
            )
        }
        TryPlayMedia(e) {
            this._iRuntime.TryPlayMedia(e)
        }
        RemovePendingPlay(e) {
            this._iRuntime.RemovePendingPlay(e)
        }
        ReleaseInstancesForBuffer(t) {
            let n = 0;
            for (let o = 0, e = this._audioInstances.length; o < e; ++o) {
                const a = this._audioInstances[o];
                this._audioInstances[n] = a,
                a.GetBuffer() === t ? a.Release() : ++n
            }
            this._audioInstances.length = n
        }
        ReleaseAllMusicBuffers() {
            let e = 0;
            for (let t = 0, n = this._audioBuffers.length; t < n; ++t) {
                const n = this._audioBuffers[t];
                this._audioBuffers[e] = n,
                n.IsMusic() ? n.Release() : ++e
            }
            this._audioBuffers.length = e
        }
        *audioInstancesByTag(t) {
            if (t)
                for (const n of this._audioInstances)
                    e(n.GetTag(), t) && (yield n);
            else
                this._lastAudioInstance && !this._lastAudioInstance.HasEnded() && (yield this._lastAudioInstance)
        }
        async _GetAudioBuffer(t, n, a, o, i) {
            for (const e of this._audioBuffers)
                if (e.GetUrl() === n)
                    return await e.Load(),
                    e;
            if (i)
                return null;
            o && (this._playMusicAsSound || this._hasAnySoftwareDecodedMusic) && this.ReleaseAllMusicBuffers();
            const e = C3AudioBuffer.Create(this, t, n, a, o);
            return this._audioBuffers.push(e),
            await e.Load(),
            e
        }
        async _GetAudioInstance(t, n, a, o, i) {
            for (const e of this._audioInstances)
                if (e.GetUrl() === n && (e.CanBeRecycled() || i))
                    return e.SetTag(o),
                    e;
            const e = await this._GetAudioBuffer(t, n, a, i)
              , r = e.CreateInstance(o);
            return this._audioInstances.push(r),
            r
        }
        _AddPendingTag(e) {
            let t = this._pendingTags.get(e);
            if (!t) {
                let n = null;
                const a = new Promise(e=>n = e);
                t = {
                    pendingCount: 0,
                    promise: a,
                    resolve: n
                },
                this._pendingTags.set(e, t)
            }
            t.pendingCount++
        }
        _RemovePendingTag(e) {
            const t = this._pendingTags.get(e);
            if (!t)
                throw new Error("expected pending tag");
            t.pendingCount--,
            0 === t.pendingCount && (t.resolve(),
            this._pendingTags.delete(e))
        }
        TagReady(e) {
            e || (e = this._lastPlayedTag);
            const t = this._pendingTags.get(e);
            return t ? t.promise : Promise.resolve()
        }
        _MaybeStartTicking() {
            if (0 < this._analysers.size)
                return void this._StartTicking();
            for (const e of this._audioInstances)
                if (e.IsActive())
                    return void this._StartTicking()
        }
        Tick() {
            for (const e of this._analysers)
                e.Tick();
            const e = this.GetAudioCurrentTime();
            for (const t of this._audioInstances)
                t.Tick(e);
            const t = this._audioInstances.filter(e=>e.IsActive()).map(e=>e.GetState());
            this.PostToRuntime("state", {
                tickCount: this._lastTickCount,
                audioInstances: t,
                analysers: [...this._analysers].map(e=>e.GetData())
            }),
            0 === t.length && 0 === this._analysers.size && this._StopTicking()
        }
        PostTrigger(e, t, n) {
            this.PostToRuntime("trigger", {
                type: e,
                tag: t,
                aiid: n
            })
        }
        async _Play(t) {
            const n = t.originalUrl
              , a = t.url
              , o = t.type
              , r = t.isMusic
              , e = t.tag
              , d = t.isLooping
              , s = t.vol
              , u = t.pos
              , i = t.panning;
            let l = t.off;
            if (0 < l && !t.trueClock)
                if (this._audioContext.getOutputTimestamp) {
                    const e = this._audioContext.getOutputTimestamp();
                    l = l - e.performanceTime / 1e3 + e.contextTime
                } else
                    l = l - performance.now() / 1e3 + this._audioContext.currentTime;
            this._lastPlayedTag = e,
            this._AddPendingTag(e);
            try {
                this._lastAudioInstance = await this._GetAudioInstance(n, a, o, e, r),
                i ? (this._lastAudioInstance.SetPannerEnabled(!0),
                this._lastAudioInstance.SetPan(i.x, i.y, i.angle, i.innerAngle, i.outerAngle, i.outerGain),
                i.hasOwnProperty("uid") && this._lastAudioInstance.SetUID(i.uid)) : this._lastAudioInstance.SetPannerEnabled(!1),
                this._lastAudioInstance.Play(d, s, u, l)
            } catch (e) {
                return void console.error("[Construct 3] Audio: error starting playback: ", e)
            } finally {
                this._RemovePendingTag(e)
            }
            this._StartTicking()
        }
        _Stop(e) {
            const t = e.tag;
            for (const n of this.audioInstancesByTag(t))
                n.Stop()
        }
        _StopAll() {
            for (const e of this._audioInstances)
                e.Stop()
        }
        _SetPaused(e) {
            const t = e.tag
              , n = e.paused;
            for (const a of this.audioInstancesByTag(t))
                n ? a.Pause() : a.Resume();
            this._MaybeStartTicking()
        }
        _SetVolume(e) {
            const t = e.tag
              , n = e.vol;
            for (const a of this.audioInstancesByTag(t))
                a.SetVolume(n)
        }
        async _FadeVolume(t) {
            const n = t.tag
              , a = t.vol
              , o = t.duration
              , i = t.stopOnEnd;
            await this.TagReady(n);
            for (const e of this.audioInstancesByTag(n))
                e.FadeVolume(a, o, i);
            this._MaybeStartTicking()
        }
        _SetMasterVolume(e) {
            this._masterVolume = e.vol;
            for (const t of this._audioInstances)
                t._UpdateVolume()
        }
        _SetMuted(e) {
            const t = e.tag
              , n = e.isMuted;
            for (const a of this.audioInstancesByTag(t))
                a.SetMuted(n)
        }
        _SetSilent(e) {
            this._isSilent = e.isSilent,
            this._iRuntime.SetSilent(this._isSilent);
            for (const t of this._audioInstances)
                t._UpdateMuted()
        }
        _SetLooping(e) {
            const t = e.tag
              , n = e.isLooping;
            for (const a of this.audioInstancesByTag(t))
                a.SetLooping(n)
        }
        async _SetPlaybackRate(e) {
            const t = e.tag
              , n = e.rate;
            await this.TagReady(t);
            for (const a of this.audioInstancesByTag(t))
                a.SetPlaybackRate(n)
        }
        async _Seek(e) {
            const t = e.tag
              , n = e.pos;
            await this.TagReady(t);
            for (const a of this.audioInstancesByTag(t))
                a.Seek(n)
        }
        async _Preload(t) {
            const n = t.originalUrl
              , a = t.url
              , o = t.type
              , i = t.isMusic;
            try {
                await this._GetAudioInstance(n, a, o, "", i)
            } catch (e) {
                console.error("[Construct 3] Audio: error preloading: ", e)
            }
        }
        async _Unload(t) {
            const n = t.url
              , a = t.type
              , o = t.isMusic
              , i = await this._GetAudioBuffer("", n, a, o, !0);
            if (i) {
                i.Release();
                const e = this._audioBuffers.indexOf(i);
                -1 !== e && this._audioBuffers.splice(e, 1)
            }
        }
        _UnloadAll() {
            for (const e of this._audioBuffers)
                e.Release();
            this._audioBuffers.length = 0
        }
        _SetSuspended(e) {
            const t = e.isSuspended;
            !t && this._audioContext.resume && this._audioContext.resume();
            for (const n of this._audioInstances)
                n.SetSuspended(t);
            t && this._audioContext.suspend && this._audioContext.suspend()
        }
        _OnTick(e) {
            if (this._timeScale = e.timeScale,
            this._gameTime = e.gameTime,
            this._lastTickCount = e.tickCount,
            0 !== this._timeScaleMode)
                for (const e of this._audioInstances)
                    e._UpdatePlaybackRate();
            const t = e.listenerPos;
            t && this._audioContext.listener.setPosition(t[0], t[1], t[2]);
            for (const t of e.instPans) {
                const e = t.uid;
                for (const n of this._audioInstances)
                    n.GetUID() === e && n.SetPanXYA(t.x, t.y, t.angle)
            }
        }
        async _AddEffect(t) {
            const n = t.type
              , a = t.tag
              , o = t.params;
            let i;
            if ("filter" === n)
                i = new C3AudioFilterFX(this,...o);
            else if ("delay" === n)
                i = new C3AudioDelayFX(this,...o);
            else if ("convolution" === n) {
                let e = null;
                try {
                    e = await this._GetAudioBuffer(t.bufferOriginalUrl, t.bufferUrl, t.bufferType, !1)
                } catch (e) {
                    return void console.log("[Construct 3] Audio: error loading convolution: ", e)
                }
                i = new C3AudioConvolveFX(this,e.GetAudioBuffer(),...o),
                i._SetBufferInfo(t.bufferOriginalUrl, t.bufferUrl, t.bufferType)
            } else if ("flanger" === n)
                i = new C3AudioFlangerFX(this,...o);
            else if ("phaser" === n)
                i = new C3AudioPhaserFX(this,...o);
            else if ("gain" === n)
                i = new C3AudioGainFX(this,...o);
            else if ("tremolo" === n)
                i = new C3AudioTremoloFX(this,...o);
            else if ("ringmod" === n)
                i = new C3AudioRingModFX(this,...o);
            else if ("distortion" === n)
                i = new C3AudioDistortionFX(this,...o);
            else if ("compressor" === n)
                i = new C3AudioCompressorFX(this,...o);
            else if ("analyser" === n)
                i = new C3AudioAnalyserFX(this,...o);
            else
                throw new Error("invalid effect type");
            this.AddEffectForTag(a, i),
            this._PostUpdatedFxState()
        }
        _SetEffectParam(t) {
            const n = t.tag
              , a = t.index
              , o = t.param
              , i = t.value
              , e = t.ramp
              , r = t.time
              , d = this._effects.get(n);
            !d || 0 > a || a >= d.length || (d[a].SetParam(o, i, e, r),
            this._PostUpdatedFxState())
        }
        _RemoveEffects(e) {
            const t = e.tag.toLowerCase()
              , n = this._effects.get(t);
            if (n && n.length) {
                for (const e of n)
                    e.Release();
                this._effects.delete(t),
                this._ReconnectEffects(t)
            }
        }
        _AddAnalyser(e) {
            this._analysers.add(e),
            this._MaybeStartTicking()
        }
        _RemoveAnalyser(e) {
            this._analysers.delete(e)
        }
        _PostUpdatedFxState() {
            this._isPendingPostFxState || (this._isPendingPostFxState = !0,
            Promise.resolve().then(()=>this._DoPostUpdatedFxState()))
        }
        _DoPostUpdatedFxState() {
            const e = {};
            for (const [t,n] of this._effects)
                e[t] = n.map(e=>e.GetState());
            this.PostToRuntime("fxstate", {
                fxstate: e
            }),
            this._isPendingPostFxState = !1
        }
        async _OnLoadState(e) {
            const t = e.saveLoadMode;
            if (3 !== t)
                for (const e of this._audioInstances)
                    e.IsMusic() && 1 === t || !e.IsMusic() && 2 === t || e.Stop();
            for (const t of this._effects.values())
                for (const e of t)
                    e.Release();
            this._effects.clear(),
            this._timeScale = e.timeScale,
            this._gameTime = e.gameTime;
            const n = e.listenerPos;
            this._audioContext.listener.setPosition(n[0], n[1], n[2]),
            this._isSilent = e.isSilent,
            this._iRuntime.SetSilent(this._isSilent),
            this._masterVolume = e.masterVolume;
            const a = [];
            for (const t of Object.values(e.effects))
                a.push(Promise.all(t.map(e=>this._AddEffect(e))));
            await Promise.all(a),
            await Promise.all(e.playing.map(e=>this._LoadAudioInstance(e, t))),
            this._MaybeStartTicking()
        }
        async _LoadAudioInstance(t, n) {
            if (3 === n)
                return;
            const a = t.bufferOriginalUrl
              , o = t.bufferUrl
              , r = t.bufferType
              , e = t.isMusic
              , d = t.tag
              , s = t.isLooping
              , u = t.volume
              , i = t.playbackTime;
            if (e && 1 === n)
                return;
            if (!e && 2 === n)
                return;
            let l = null;
            try {
                l = await this._GetAudioInstance(a, o, r, d, e)
            } catch (e) {
                return void console.error("[Construct 3] Audio: error loading audio state: ", e)
            }
            l.LoadPanState(t.pan),
            l.Play(s, u, i, 0),
            t.isPlaying || l.Pause(),
            l._LoadAdditionalState(t)
        }
        _OnMicrophoneStream(e, t) {
            this._microphoneSource && this._microphoneSource.disconnect(),
            this._microphoneTag = t.toLowerCase(),
            this._microphoneSource = this._audioContext.createMediaStreamSource(e),
            this._microphoneSource.connect(this.GetDestinationForTag(this._microphoneTag))
        }
        _OnGetOutputStream() {
            return this._destMediaStreamNode || (this._destMediaStreamNode = this._audioContext.createMediaStreamDestination(),
            this._destinationNode.connect(this._destMediaStreamNode)),
            this._destMediaStreamNode.stream
        }
    }
    ;
    RuntimeInterface.AddDOMHandlerClass(t)
}
"use strict",
self.C3AudioBuffer = class {
    constructor(t, n, a, o, i) {
        this._audioDomHandler = t,
        this._originalUrl = n,
        this._url = a,
        this._type = o,
        this._isMusic = i,
        this._api = "",
        this._loadState = "not-loaded",
        this._loadPromise = null
    }
    Release() {
        this._loadState = "not-loaded",
        this._audioDomHandler = null,
        this._loadPromise = null
    }
    static Create(t, n, a, o, i) {
        const e = "audio/webm; codecs=opus" === o && !t.SupportsWebMOpus();
        return i && e && t._SetHasAnySoftwareDecodedMusic(),
        !i || t.IsPlayMusicAsSound() || e ? new C3WebAudioBuffer(t,n,a,o,i,e) : new C3Html5AudioBuffer(t,n,a,o,i)
    }
    CreateInstance(e) {
        return "html5" === this._api ? new C3Html5AudioInstance(this._audioDomHandler,this,e) : new C3WebAudioInstance(this._audioDomHandler,this,e)
    }
    _Load() {}
    Load() {
        return this._loadPromise || (this._loadPromise = this._Load()),
        this._loadPromise
    }
    IsLoaded() {}
    IsLoadedAndDecoded() {}
    HasFailedToLoad() {
        return "failed" === this._loadState
    }
    GetAudioContext() {
        return this._audioDomHandler.GetAudioContext()
    }
    GetApi() {
        return this._api
    }
    GetOriginalUrl() {
        return this._originalUrl
    }
    GetUrl() {
        return this._url
    }
    GetContentType() {
        return this._type
    }
    IsMusic() {
        return this._isMusic
    }
    GetDuration() {}
}
,
"use strict",
self.C3Html5AudioBuffer = class extends C3AudioBuffer {
    constructor(t, n, a, o, i) {
        super(t, n, a, o, i),
        this._api = "html5",
        this._audioElem = new Audio,
        this._audioElem.crossOrigin = "anonymous",
        this._audioElem.autoplay = !1,
        this._audioElem.preload = "auto",
        this._loadResolve = null,
        this._loadReject = null,
        this._reachedCanPlayThrough = !1,
        this._audioElem.addEventListener("canplaythrough", ()=>this._reachedCanPlayThrough = !0),
        this._outNode = this.GetAudioContext().createGain(),
        this._mediaSourceNode = null,
        this._audioElem.addEventListener("canplay", ()=>{
            this._loadResolve && (this._loadState = "loaded",
            this._loadResolve(),
            this._loadResolve = null,
            this._loadReject = null),
            this._mediaSourceNode || !this._audioElem || (this._mediaSourceNode = this.GetAudioContext().createMediaElementSource(this._audioElem),
            this._mediaSourceNode.connect(this._outNode))
        }
        ),
        this.onended = null,
        this._audioElem.addEventListener("ended", ()=>{
            this.onended && this.onended()
        }
        ),
        this._audioElem.addEventListener("error", e=>this._OnError(e))
    }
    Release() {
        this._audioDomHandler.ReleaseInstancesForBuffer(this),
        this._outNode.disconnect(),
        this._outNode = null,
        this._mediaSourceNode.disconnect(),
        this._mediaSourceNode = null,
        this._audioElem && !this._audioElem.paused && this._audioElem.pause(),
        this.onended = null,
        this._audioElem = null,
        super.Release()
    }
    _Load() {
        return this._loadState = "loading",
        new Promise((e,t)=>{
            this._loadResolve = e,
            this._loadReject = t,
            this._audioElem.src = this._url
        }
        )
    }
    _OnError(e) {
        console.error(`[Construct 3] Audio '${this._url}' error: `, e),
        this._loadReject && (this._loadState = "failed",
        this._loadReject(e),
        this._loadResolve = null,
        this._loadReject = null)
    }
    IsLoaded() {
        const e = 4 <= this._audioElem.readyState;
        return e && (this._reachedCanPlayThrough = !0),
        e || this._reachedCanPlayThrough
    }
    IsLoadedAndDecoded() {
        return this.IsLoaded()
    }
    GetAudioElement() {
        return this._audioElem
    }
    GetOutputNode() {
        return this._outNode
    }
    GetDuration() {
        return this._audioElem.duration
    }
}
,
"use strict",
self.C3WebAudioBuffer = class extends C3AudioBuffer {
    constructor(t, n, a, o, i, e) {
        super(t, n, a, o, i),
        this._api = "webaudio",
        this._audioData = null,
        this._audioBuffer = null,
        this._needsSoftwareDecode = !!e
    }
    Release() {
        this._audioDomHandler.ReleaseInstancesForBuffer(this),
        this._audioData = null,
        this._audioBuffer = null,
        super.Release()
    }
    async _Fetch() {
        if (this._audioData)
            return this._audioData;
        const e = this._audioDomHandler.GetRuntimeInterface();
        if ("cordova" === e.GetExportType() && e.IsRelativeURL(this._url))
            this._audioData = await e.CordovaFetchLocalFileAsArrayBuffer(this._url);
        else {
            const e = await fetch(this._url);
            if (!e.ok)
                throw new Error(`error fetching audio data: ${e.status} ${e.statusText}`);
            this._audioData = await e.arrayBuffer()
        }
    }
    async _Decode() {
        return this._audioBuffer ? this._audioBuffer : void (this._audioBuffer = await this._audioDomHandler.DecodeAudioData(this._audioData, this._needsSoftwareDecode),
        this._audioData = null)
    }
    async _Load() {
        try {
            this._loadState = "loading",
            await this._Fetch(),
            await this._Decode(),
            this._loadState = "loaded"
        } catch (e) {
            this._loadState = "failed",
            console.error(`[Construct 3] Failed to load audio '${this._url}': `, e)
        }
    }
    IsLoaded() {
        return !!(this._audioData || this._audioBuffer)
    }
    IsLoadedAndDecoded() {
        return !!this._audioBuffer
    }
    GetAudioBuffer() {
        return this._audioBuffer
    }
    GetDuration() {
        return this._audioBuffer ? this._audioBuffer.duration : 0
    }
}
,
"use strict";
{
    function t(t) {
        return t * e
    }
    const e = 180 / Math.PI;
    let n = 0;
    self.C3AudioInstance = class {
        constructor(t, a, o) {
            this._audioDomHandler = t,
            this._buffer = a,
            this._tag = o,
            this._aiId = n++,
            this._gainNode = this.GetAudioContext().createGain(),
            this._gainNode.connect(this.GetDestinationNode()),
            this._pannerNode = null,
            this._isPannerEnabled = !1,
            this._isStopped = !0,
            this._isPaused = !1,
            this._resumeMe = !1,
            this._isLooping = !1,
            this._volume = 1,
            this._isMuted = !1,
            this._playbackRate = 1;
            const i = this._audioDomHandler.GetTimeScaleMode();
            this._isTimescaled = 1 === i && !this.IsMusic() || 2 === i,
            this._instUid = -1,
            this._fadeEndTime = -1,
            this._stopOnFadeEnd = !1
        }
        Release() {
            this._audioDomHandler = null,
            this._buffer = null,
            this._pannerNode && (this._pannerNode.disconnect(),
            this._pannerNode = null),
            this._gainNode.disconnect(),
            this._gainNode = null
        }
        GetAudioContext() {
            return this._audioDomHandler.GetAudioContext()
        }
        GetDestinationNode() {
            return this._audioDomHandler.GetDestinationForTag(this._tag)
        }
        GetMasterVolume() {
            return this._audioDomHandler.GetMasterVolume()
        }
        GetCurrentTime() {
            return this._isTimescaled ? this._audioDomHandler.GetGameTime() : performance.now() / 1e3
        }
        GetOriginalUrl() {
            return this._buffer.GetOriginalUrl()
        }
        GetUrl() {
            return this._buffer.GetUrl()
        }
        GetContentType() {
            return this._buffer.GetContentType()
        }
        GetBuffer() {
            return this._buffer
        }
        IsMusic() {
            return this._buffer.IsMusic()
        }
        SetTag(e) {
            this._tag = e
        }
        GetTag() {
            return this._tag
        }
        GetAiId() {
            return this._aiId
        }
        HasEnded() {}
        CanBeRecycled() {}
        IsPlaying() {
            return !this._isStopped && !this._isPaused && !this.HasEnded()
        }
        IsActive() {
            return !this._isStopped && !this.HasEnded()
        }
        GetPlaybackTime() {}
        GetDuration(e) {
            let t = this._buffer.GetDuration();
            return e && (t /= this._playbackRate || .001),
            t
        }
        Play() {}
        Stop() {}
        Pause() {}
        IsPaused() {
            return this._isPaused
        }
        Resume() {}
        SetVolume(e) {
            this._volume = e,
            this._gainNode.gain.cancelScheduledValues(0),
            this._fadeEndTime = -1,
            this._gainNode.gain.value = this.GetOverallVolume()
        }
        FadeVolume(t, n, o) {
            if (!this.IsMuted()) {
                t *= this.GetMasterVolume();
                const a = this._gainNode.gain;
                a.cancelScheduledValues(0);
                const i = this._audioDomHandler.GetAudioCurrentTime()
                  , e = i + n;
                a.setValueAtTime(a.value, i),
                a.linearRampToValueAtTime(t, e),
                this._volume = t,
                this._fadeEndTime = e,
                this._stopOnFadeEnd = o
            }
        }
        _UpdateVolume() {
            this.SetVolume(this._volume)
        }
        Tick(e) {
            -1 !== this._fadeEndTime && e >= this._fadeEndTime && (this._fadeEndTime = -1,
            this._stopOnFadeEnd && this.Stop(),
            this._audioDomHandler.PostTrigger("fade-ended", this._tag, this._aiId))
        }
        GetOverallVolume() {
            const e = this._volume * this.GetMasterVolume();
            return isFinite(e) ? e : 0
        }
        SetMuted(e) {
            e = !!e,
            this._isMuted === e || (this._isMuted = e,
            this._UpdateMuted())
        }
        IsMuted() {
            return this._isMuted
        }
        IsSilent() {
            return this._audioDomHandler.IsSilent()
        }
        _UpdateMuted() {}
        SetLooping() {}
        IsLooping() {
            return this._isLooping
        }
        SetPlaybackRate(e) {
            this._playbackRate === e || (this._playbackRate = e,
            this._UpdatePlaybackRate())
        }
        _UpdatePlaybackRate() {}
        GetPlaybackRate() {
            return this._playbackRate
        }
        Seek() {}
        SetSuspended() {}
        SetPannerEnabled(e) {
            e = !!e,
            this._isPannerEnabled === e || (this._isPannerEnabled = e,
            this._isPannerEnabled ? (!this._pannerNode && (this._pannerNode = this.GetAudioContext().createPanner(),
            this._pannerNode.panningModel = this._audioDomHandler.GetPanningModel(),
            this._pannerNode.distanceModel = this._audioDomHandler.GetDistanceModel(),
            this._pannerNode.refDistance = this._audioDomHandler.GetReferenceDistance(),
            this._pannerNode.maxDistance = this._audioDomHandler.GetMaxDistance(),
            this._pannerNode.rolloffFactor = this._audioDomHandler.GetRolloffFactor()),
            this._gainNode.disconnect(),
            this._gainNode.connect(this._pannerNode),
            this._pannerNode.connect(this.GetDestinationNode())) : (this._pannerNode.disconnect(),
            this._gainNode.disconnect(),
            this._gainNode.connect(this.GetDestinationNode())))
        }
        SetPan(n, a, o, i, e, r) {
            this._isPannerEnabled && (this.SetPanXYA(n, a, o),
            this._pannerNode.coneInnerAngle = t(i),
            this._pannerNode.coneOuterAngle = t(e),
            this._pannerNode.coneOuterGain = r)
        }
        SetPanXYA(e, t, n) {
            this._isPannerEnabled && (this._pannerNode.setPosition(e, t, 0),
            this._pannerNode.setOrientation(Math.cos(n), Math.sin(n), 0))
        }
        SetUID(e) {
            this._instUid = e
        }
        GetUID() {
            return this._instUid
        }
        GetResumePosition() {}
        Reconnect(e) {
            const t = this._pannerNode || this._gainNode;
            t.disconnect(),
            t.connect(e)
        }
        GetState() {
            return {
                aiid: this.GetAiId(),
                tag: this._tag,
                duration: this.GetDuration(),
                volume: this._volume,
                isPlaying: this.IsPlaying(),
                playbackTime: this.GetPlaybackTime(),
                playbackRate: this.GetPlaybackRate(),
                uid: this._instUid,
                bufferOriginalUrl: this.GetOriginalUrl(),
                bufferUrl: "",
                bufferType: this.GetContentType(),
                isMusic: this.IsMusic(),
                isLooping: this.IsLooping(),
                isMuted: this.IsMuted(),
                resumePosition: this.GetResumePosition(),
                pan: this.GetPanState()
            }
        }
        _LoadAdditionalState(e) {
            this.SetPlaybackRate(e.playbackRate),
            this.SetMuted(e.isMuted)
        }
        GetPanState() {
            if (!this._pannerNode)
                return null;
            const e = this._pannerNode;
            return {
                pos: [e.positionX.value, e.positionY.value, e.positionZ.value],
                orient: [e.orientationX.value, e.orientationY.value, e.orientationZ.value],
                cia: e.coneInnerAngle,
                coa: e.coneOuterAngle,
                cog: e.coneOuterGain,
                uid: this._instUid
            }
        }
        LoadPanState(e) {
            if (!e)
                return void this.SetPannerEnabled(!1);
            this.SetPannerEnabled(!0);
            const t = this._pannerNode;
            t.setPosition(...t.pos),
            t.setOrientation(...t.orient),
            t.coneInnerAngle = t.cia,
            t.coneOuterAngle = t.coa,
            t.coneOuterGain = t.cog,
            this._instUid = t.uid
        }
    }
}
"use strict",
self.C3Html5AudioInstance = class extends C3AudioInstance {
    constructor(e, t, n) {
        super(e, t, n),
        this._buffer.GetOutputNode().connect(this._gainNode),
        this._buffer.onended = ()=>this._OnEnded()
    }
    Release() {
        this.Stop(),
        this._buffer.GetOutputNode().disconnect(),
        super.Release()
    }
    GetAudioElement() {
        return this._buffer.GetAudioElement()
    }
    _OnEnded() {
        this._isStopped = !0,
        this._instUid = -1,
        this._audioDomHandler.PostTrigger("ended", this._tag, this._aiId)
    }
    HasEnded() {
        return this.GetAudioElement().ended
    }
    CanBeRecycled() {
        return !!this._isStopped || this.HasEnded()
    }
    GetPlaybackTime(e) {
        let t = this.GetAudioElement().currentTime;
        return e && (t *= this._playbackRate),
        this._isLooping || (t = Math.min(t, this.GetDuration())),
        t
    }
    Play(e, t, n) {
        const a = this.GetAudioElement();
        if (1 !== a.playbackRate && (a.playbackRate = 1),
        a.loop !== e && (a.loop = e),
        this.SetVolume(t),
        a.muted && (a.muted = !1),
        a.currentTime !== n)
            try {
                a.currentTime = n
            } catch (e) {
                console.warn(`[Construct 3] Exception seeking audio '${this._buffer.GetUrl()}' to position '${n}': `, e)
            }
        this._audioDomHandler.TryPlayMedia(a),
        this._isStopped = !1,
        this._isPaused = !1,
        this._isLooping = e,
        this._playbackRate = 1
    }
    Stop() {
        const e = this.GetAudioElement();
        e.paused || e.pause(),
        this._audioDomHandler.RemovePendingPlay(e),
        this._isStopped = !0,
        this._isPaused = !1,
        this._instUid = -1
    }
    Pause() {
        if (!(this._isPaused || this._isStopped || this.HasEnded())) {
            const e = this.GetAudioElement();
            e.paused || e.pause(),
            this._audioDomHandler.RemovePendingPlay(e),
            this._isPaused = !0
        }
    }
    Resume() {
        !this._isPaused || this._isStopped || this.HasEnded() || (this._audioDomHandler.TryPlayMedia(this.GetAudioElement()),
        this._isPaused = !1)
    }
    _UpdateMuted() {
        this.GetAudioElement().muted = this._isMuted || this.IsSilent()
    }
    SetLooping(e) {
        e = !!e,
        this._isLooping === e || (this._isLooping = e,
        this.GetAudioElement().loop = e)
    }
    _UpdatePlaybackRate() {
        let e = this._playbackRate;
        this._isTimescaled && (e *= this._audioDomHandler.GetTimeScale());
        try {
            this.GetAudioElement().playbackRate = e
        } catch (t) {
            console.warn(`[Construct 3] Unable to set playback rate '${e}':`, t)
        }
    }
    Seek(e) {
        if (!(this._isStopped || this.HasEnded()))
            try {
                this.GetAudioElement().currentTime = e
            } catch (t) {
                console.warn(`[Construct 3] Error seeking audio to '${e}': `, t)
            }
    }
    GetResumePosition() {
        return this.GetPlaybackTime()
    }
    SetSuspended(e) {
        e ? this.IsPlaying() ? (this.GetAudioElement().pause(),
        this._resumeMe = !0) : this._resumeMe = !1 : this._resumeMe && (this._audioDomHandler.TryPlayMedia(this.GetAudioElement()),
        this._resumeMe = !1)
    }
}
,
"use strict",
self.C3WebAudioInstance = class extends C3AudioInstance {
    constructor(e, t, n) {
        super(e, t, n),
        this._bufferSource = null,
        this._onended_handler = e=>this._OnEnded(e),
        this._hasPlaybackEnded = !0,
        this._activeSource = null,
        this._startTime = 0,
        this._resumePosition = 0,
        this._muteVol = 1
    }
    Release() {
        this.Stop(),
        this._ReleaseBufferSource(),
        this._onended_handler = null,
        super.Release()
    }
    _ReleaseBufferSource() {
        this._bufferSource && this._bufferSource.disconnect(),
        this._bufferSource = null,
        this._activeSource = null
    }
    _OnEnded(e) {
        this._isPaused || this._resumeMe || e.target !== this._activeSource || (this._hasPlaybackEnded = !0,
        this._isStopped = !0,
        this._instUid = -1,
        this._ReleaseBufferSource(),
        this._audioDomHandler.PostTrigger("ended", this._tag, this._aiId))
    }
    HasEnded() {
        return !(!this._isStopped && this._bufferSource && this._bufferSource.loop) && !this._isPaused && this._hasPlaybackEnded
    }
    CanBeRecycled() {
        return !this._bufferSource || this._isStopped || this.HasEnded()
    }
    GetPlaybackTime(e) {
        let t = 0;
        return t = this._isPaused ? this._resumePosition : this.GetCurrentTime() - this._startTime,
        e && (t *= this._playbackRate),
        this._isLooping || (t = Math.min(t, this.GetDuration())),
        t
    }
    Play(e, t, n, a) {
        this._muteVol = 1,
        this.SetVolume(t),
        this._ReleaseBufferSource(),
        this._bufferSource = this.GetAudioContext().createBufferSource(),
        this._bufferSource.buffer = this._buffer.GetAudioBuffer(),
        this._bufferSource.connect(this._gainNode),
        this._activeSource = this._bufferSource,
        this._bufferSource.onended = this._onended_handler,
        this._bufferSource.loop = e,
        this._bufferSource.start(a, n),
        this._hasPlaybackEnded = !1,
        this._isStopped = !1,
        this._isPaused = !1,
        this._isLooping = e,
        this._playbackRate = 1,
        this._startTime = this.GetCurrentTime() - n
    }
    Stop() {
        this._bufferSource && this._bufferSource.stop(0),
        this._isStopped = !0,
        this._isPaused = !1,
        this._instUid = -1
    }
    Pause() {
        this._isPaused || this._isStopped || this.HasEnded() || (this._resumePosition = this.GetPlaybackTime(!0),
        this._isLooping && (this._resumePosition %= this.GetDuration()),
        this._isPaused = !0,
        this._bufferSource.stop(0))
    }
    Resume() {
        !this._isPaused || this._isStopped || this.HasEnded() || (this._ReleaseBufferSource(),
        this._bufferSource = this.GetAudioContext().createBufferSource(),
        this._bufferSource.buffer = this._buffer.GetAudioBuffer(),
        this._bufferSource.connect(this._gainNode),
        this._activeSource = this._bufferSource,
        this._bufferSource.onended = this._onended_handler,
        this._bufferSource.loop = this._isLooping,
        this._UpdateVolume(),
        this._UpdatePlaybackRate(),
        this._startTime = this.GetCurrentTime() - this._resumePosition / (this._playbackRate || .001),
        this._bufferSource.start(0, this._resumePosition),
        this._isPaused = !1)
    }
    GetOverallVolume() {
        return super.GetOverallVolume() * this._muteVol
    }
    _UpdateMuted() {
        this._muteVol = this._isMuted || this.IsSilent() ? 0 : 1,
        this._UpdateVolume()
    }
    SetLooping(e) {
        e = !!e,
        this._isLooping === e || (this._isLooping = e,
        this._bufferSource && (this._bufferSource.loop = e))
    }
    _UpdatePlaybackRate() {
        let e = this._playbackRate;
        this._isTimescaled && (e *= this._audioDomHandler.GetTimeScale()),
        this._bufferSource && (this._bufferSource.playbackRate.value = e)
    }
    Seek(e) {
        this._isStopped || this.HasEnded() || (this._isPaused ? this._resumePosition = e : (this.Pause(),
        this._resumePosition = e,
        this.Resume()))
    }
    GetResumePosition() {
        return this._resumePosition
    }
    SetSuspended(e) {
        e ? this.IsPlaying() ? (this._resumeMe = !0,
        this._resumePosition = this.GetPlaybackTime(!0),
        this._isLooping && (this._resumePosition %= this.GetDuration()),
        this._bufferSource.stop(0)) : this._resumeMe = !1 : this._resumeMe && (this._ReleaseBufferSource(),
        this._bufferSource = this.GetAudioContext().createBufferSource(),
        this._bufferSource.buffer = this._buffer.GetAudioBuffer(),
        this._bufferSource.connect(this._gainNode),
        this._activeSource = this._bufferSource,
        this._bufferSource.onended = this._onended_handler,
        this._bufferSource.loop = this._isLooping,
        this._UpdateVolume(),
        this._UpdatePlaybackRate(),
        this._startTime = this.GetCurrentTime() - this._resumePosition / (this._playbackRate || .001),
        this._bufferSource.start(0, this._resumePosition),
        this._resumeMe = !1)
    }
    _LoadAdditionalState(e) {
        super._LoadAdditionalState(e),
        this._resumePosition = e.resumePosition
    }
}
,
"use strict";
{
    function t(e) {
        return Math.pow(10, e / 20)
    }
    function n(e) {
        return Math.max(Math.min(t(e), 1), 0)
    }
    function o(e) {
        return 20 * (Math.log(e) / 2.302585092994046)
    }
    function i(e) {
        return o(Math.max(Math.min(e, 1), 0))
    }
    function r(e, t) {
        return 1 - Math.exp(-t * e)
    }
    class e {
        constructor(e) {
            this._audioDomHandler = e,
            this._audioContext = e.GetAudioContext(),
            this._index = -1,
            this._tag = "",
            this._type = "",
            this._params = null
        }
        Release() {
            this._audioContext = null
        }
        _SetIndex(e) {
            this._index = e
        }
        GetIndex() {
            return this._index
        }
        _SetTag(e) {
            this._tag = e
        }
        GetTag() {
            return this._tag
        }
        CreateGain() {
            return this._audioContext.createGain()
        }
        GetInputNode() {}
        ConnectTo() {}
        SetAudioParam(t, n, a, o) {
            if (t.cancelScheduledValues(0),
            0 === o)
                return void (t.value = n);
            const i = this._audioContext.currentTime;
            o += i,
            0 === a ? t.setValueAtTime(n, o) : 1 === a ? (t.setValueAtTime(t.value, i),
            t.linearRampToValueAtTime(n, o)) : 2 === a ? (t.setValueAtTime(t.value, i),
            t.exponentialRampToValueAtTime(n, o)) : void 0
        }
        GetState() {
            return {
                type: this._type,
                tag: this._tag,
                params: this._params
            }
        }
    }
    self.C3AudioFilterFX = class extends e {
        constructor(t, n, a, o, i, e, r) {
            super(t),
            this._type = "filter",
            this._params = [n, a, o, i, e, r],
            this._inputNode = this.CreateGain(),
            this._wetNode = this.CreateGain(),
            this._wetNode.gain.value = r,
            this._dryNode = this.CreateGain(),
            this._dryNode.gain.value = 1 - r,
            this._filterNode = this._audioContext.createBiquadFilter(),
            this._filterNode.type = n,
            this._filterNode.frequency.value = a,
            this._filterNode.detune.value = o,
            this._filterNode.Q.value = i,
            this._filterNode.gain.vlaue = e,
            this._inputNode.connect(this._filterNode),
            this._inputNode.connect(this._dryNode),
            this._filterNode.connect(this._wetNode)
        }
        Release() {
            this._inputNode.disconnect(),
            this._filterNode.disconnect(),
            this._wetNode.disconnect(),
            this._dryNode.disconnect(),
            super.Release()
        }
        ConnectTo(e) {
            this._wetNode.disconnect(),
            this._wetNode.connect(e),
            this._dryNode.disconnect(),
            this._dryNode.connect(e)
        }
        GetInputNode() {
            return this._inputNode
        }
        SetParam(e, t, n, a) {
            0 === e ? (t = Math.max(Math.min(t / 100, 1), 0),
            this._params[5] = t,
            this.SetAudioParam(this._wetNode.gain, t, n, a),
            this.SetAudioParam(this._dryNode.gain, 1 - t, n, a)) : 1 === e ? (this._params[1] = t,
            this.SetAudioParam(this._filterNode.frequency, t, n, a)) : 2 === e ? (this._params[2] = t,
            this.SetAudioParam(this._filterNode.detune, t, n, a)) : 3 === e ? (this._params[3] = t,
            this.SetAudioParam(this._filterNode.Q, t, n, a)) : 4 === e ? (this._params[4] = t,
            this.SetAudioParam(this._filterNode.gain, t, n, a)) : void 0
        }
    }
    ,
    self.C3AudioDelayFX = class extends e {
        constructor(e, t, n, a) {
            super(e),
            this._type = "delay",
            this._params = [t, n, a],
            this._inputNode = this.CreateGain(),
            this._wetNode = this.CreateGain(),
            this._wetNode.gain.value = a,
            this._dryNode = this.CreateGain(),
            this._dryNode.gain.value = 1 - a,
            this._mainNode = this.CreateGain(),
            this._delayNode = this._audioContext.createDelay(t),
            this._delayNode.delayTime.value = t,
            this._delayGainNode = this.CreateGain(),
            this._delayGainNode.gain.value = n,
            this._inputNode.connect(this._mainNode),
            this._inputNode.connect(this._dryNode),
            this._mainNode.connect(this._wetNode),
            this._mainNode.connect(this._delayNode),
            this._delayNode.connect(this._delayGainNode),
            this._delayGainNode.connect(this._mainNode)
        }
        Release() {
            this._inputNode.disconnect(),
            this._wetNode.disconnect(),
            this._dryNode.disconnect(),
            this._mainNode.disconnect(),
            this._delayNode.disconnect(),
            this._delayGainNode.disconnect(),
            super.Release()
        }
        ConnectTo(e) {
            this._wetNode.disconnect(),
            this._wetNode.connect(e),
            this._dryNode.disconnect(),
            this._dryNode.connect(e)
        }
        GetInputNode() {
            return this._inputNode
        }
        SetParam(t, a, o, i) {
            0 === t ? (a = Math.max(Math.min(a / 100, 1), 0),
            this._params[2] = a,
            this.SetAudioParam(this._wetNode.gain, a, o, i),
            this.SetAudioParam(this._dryNode.gain, 1 - a, o, i)) : 4 === t ? (this._params[1] = n(a),
            this.SetAudioParam(this._delayGainNode.gain, n(a), o, i)) : 5 === t ? (this._params[0] = a,
            this.SetAudioParam(this._delayNode.delayTime, a, o, i)) : void 0
        }
    }
    ,
    self.C3AudioConvolveFX = class extends e {
        constructor(e, t, n, a) {
            super(e),
            this._type = "convolution",
            this._params = [n, a],
            this._bufferOriginalUrl = "",
            this._bufferUrl = "",
            this._bufferType = "",
            this._inputNode = this.CreateGain(),
            this._wetNode = this.CreateGain(),
            this._wetNode.gain.value = a,
            this._dryNode = this.CreateGain(),
            this._dryNode.gain.value = 1 - a,
            this._convolveNode = this._audioContext.createConvolver(),
            this._convolveNode.normalize = n,
            this._convolveNode.buffer = t,
            this._inputNode.connect(this._convolveNode),
            this._inputNode.connect(this._dryNode),
            this._convolveNode.connect(this._wetNode)
        }
        Release() {
            this._inputNode.disconnect(),
            this._convolveNode.disconnect(),
            this._wetNode.disconnect(),
            this._dryNode.disconnect(),
            super.Release()
        }
        ConnectTo(e) {
            this._wetNode.disconnect(),
            this._wetNode.connect(e),
            this._dryNode.disconnect(),
            this._dryNode.connect(e)
        }
        GetInputNode() {
            return this._inputNode
        }
        SetParam(e, t, n, a) {
            0 === e ? (t = Math.max(Math.min(t / 100, 1), 0),
            this._params[1] = t,
            this.SetAudioParam(this._wetNode.gain, t, n, a),
            this.SetAudioParam(this._dryNode.gain, 1 - t, n, a)) : void 0
        }
        _SetBufferInfo(e, t, n) {
            this._bufferOriginalUrl = e,
            this._bufferUrl = t,
            this._bufferType = n
        }
        GetState() {
            const e = super.GetState();
            return e.bufferOriginalUrl = this._bufferOriginalUrl,
            e.bufferUrl = "",
            e.bufferType = this._bufferType,
            e
        }
    }
    ,
    self.C3AudioFlangerFX = class extends e {
        constructor(t, n, a, o, i, e) {
            super(t),
            this._type = "flanger",
            this._params = [n, a, o, i, e],
            this._inputNode = this.CreateGain(),
            this._dryNode = this.CreateGain(),
            this._dryNode.gain.value = 1 - e / 2,
            this._wetNode = this.CreateGain(),
            this._wetNode.gain.value = e / 2,
            this._feedbackNode = this.CreateGain(),
            this._feedbackNode.gain.value = i,
            this._delayNode = this._audioContext.createDelay(n + a),
            this._delayNode.delayTime.value = n,
            this._oscNode = this._audioContext.createOscillator(),
            this._oscNode.frequency.value = o,
            this._oscGainNode = this.CreateGain(),
            this._oscGainNode.gain.value = a,
            this._inputNode.connect(this._delayNode),
            this._inputNode.connect(this._dryNode),
            this._delayNode.connect(this._wetNode),
            this._delayNode.connect(this._feedbackNode),
            this._feedbackNode.connect(this._delayNode),
            this._oscNode.connect(this._oscGainNode),
            this._oscGainNode.connect(this._delayNode.delayTime),
            this._oscNode.start(0)
        }
        Release() {
            this._oscNode.stop(0),
            this._inputNode.disconnect(),
            this._delayNode.disconnect(),
            this._oscNode.disconnect(),
            this._oscGainNode.disconnect(),
            this._dryNode.disconnect(),
            this._wetNode.disconnect(),
            this._feedbackNode.disconnect(),
            super.Release()
        }
        ConnectTo(e) {
            this._wetNode.disconnect(),
            this._wetNode.connect(e),
            this._dryNode.disconnect(),
            this._dryNode.connect(e)
        }
        GetInputNode() {
            return this._inputNode
        }
        SetParam(e, t, n, a) {
            0 === e ? (t = Math.max(Math.min(t / 100, 1), 0),
            this._params[4] = t,
            this.SetAudioParam(this._wetNode.gain, t / 2, n, a),
            this.SetAudioParam(this._dryNode.gain, 1 - t / 2, n, a)) : 6 === e ? (this._params[1] = t / 1e3,
            this.SetAudioParam(this._oscGainNode.gain, t / 1e3, n, a)) : 7 === e ? (this._params[2] = t,
            this.SetAudioParam(this._oscNode.frequency, t, n, a)) : 8 === e ? (this._params[3] = t / 100,
            this.SetAudioParam(this._feedbackNode.gain, t / 100, n, a)) : void 0
        }
    }
    ,
    self.C3AudioPhaserFX = class extends e {
        constructor(t, n, a, o, i, e, r) {
            super(t),
            this._type = "phaser",
            this._params = [n, a, o, i, e, r],
            this._inputNode = this.CreateGain(),
            this._dryNode = this.CreateGain(),
            this._dryNode.gain.value = 1 - r / 2,
            this._wetNode = this.CreateGain(),
            this._wetNode.gain.value = r / 2,
            this._filterNode = this._audioContext.createBiquadFilter(),
            this._filterNode.type = "allpass",
            this._filterNode.frequency.value = n,
            this._filterNode.detune.value = a,
            this._filterNode.Q.value = o,
            this._oscNode = this._audioContext.createOscillator(),
            this._oscNode.frequency.value = e,
            this._oscGainNode = this.CreateGain(),
            this._oscGainNode.gain.value = i,
            this._inputNode.connect(this._filterNode),
            this._inputNode.connect(this._dryNode),
            this._filterNode.connect(this._wetNode),
            this._oscNode.connect(this._oscGainNode),
            this._oscGainNode.connect(this._filterNode.frequency),
            this._oscNode.start(0)
        }
        Release() {
            this._oscNode.stop(0),
            this._inputNode.disconnect(),
            this._filterNode.disconnect(),
            this._oscNode.disconnect(),
            this._oscGainNode.disconnect(),
            this._dryNode.disconnect(),
            this._wetNode.disconnect(),
            super.Release()
        }
        ConnectTo(e) {
            this._wetNode.disconnect(),
            this._wetNode.connect(e),
            this._dryNode.disconnect(),
            this._dryNode.connect(e)
        }
        GetInputNode() {
            return this._inputNode
        }
        SetParam(e, t, n, a) {
            0 === e ? (t = Math.max(Math.min(t / 100, 1), 0),
            this._params[5] = t,
            this.SetAudioParam(this._wetNode.gain, t / 2, n, a),
            this.SetAudioParam(this._dryNode.gain, 1 - t / 2, n, a)) : 1 === e ? (this._params[0] = t,
            this.SetAudioParam(this._filterNode.frequency, t, n, a)) : 2 === e ? (this._params[1] = t,
            this.SetAudioParam(this._filterNode.detune, t, n, a)) : 3 === e ? (this._params[2] = t,
            this.SetAudioParam(this._filterNode.Q, t, n, a)) : 6 === e ? (this._params[3] = t,
            this.SetAudioParam(this._oscGainNode.gain, t, n, a)) : 7 === e ? (this._params[4] = t,
            this.SetAudioParam(this._oscNode.frequency, t, n, a)) : void 0
        }
    }
    ,
    self.C3AudioGainFX = class extends e {
        constructor(e, t) {
            super(e),
            this._type = "gain",
            this._params = [t],
            this._node = this.CreateGain(),
            this._node.gain.value = t
        }
        Release() {
            this._node.disconnect(),
            super.Release()
        }
        ConnectTo(e) {
            this._node.disconnect(),
            this._node.connect(e)
        }
        GetInputNode() {
            return this._node
        }
        SetParam(t, a, o, i) {
            4 === t ? (this._params[0] = n(a),
            this.SetAudioParam(this._node.gain, n(a), o, i)) : void 0
        }
    }
    ,
    self.C3AudioTremoloFX = class extends e {
        constructor(e, t, n) {
            super(e),
            this._type = "tremolo",
            this._params = [t, n],
            this._node = this.CreateGain(),
            this._node.gain.value = 1 - n / 2,
            this._oscNode = this._audioContext.createOscillator(),
            this._oscNode.frequency.value = t,
            this._oscGainNode = this.CreateGain(),
            this._oscGainNode.gain.value = n / 2,
            this._oscNode.connect(this._oscGainNode),
            this._oscGainNode.connect(this._node.gain),
            this._oscNode.start(0)
        }
        Release() {
            this._oscNode.stop(0),
            this._oscNode.disconnect(),
            this._oscGainNode.disconnect(),
            this._node.disconnect(),
            super.Release()
        }
        ConnectTo(e) {
            this._node.disconnect(),
            this._node.connect(e)
        }
        GetInputNode() {
            return this._node
        }
        SetParam(e, t, n, a) {
            0 === e ? (t = Math.max(Math.min(t / 100, 1), 0),
            this._params[1] = t,
            this.SetAudioParam(this._node.gain.value, 1 - t / 2, n, a),
            this.SetAudioParam(this._oscGainNode.gain.value, t / 2, n, a)) : 7 === e ? (this._params[0] = t,
            this.SetAudioParam(this._oscNode.frequency, t, n, a)) : void 0
        }
    }
    ,
    self.C3AudioRingModFX = class extends e {
        constructor(e, t, n) {
            super(e),
            this._type = "ringmod",
            this._params = [t, n],
            this._inputNode = this.CreateGain(),
            this._wetNode = this.CreateGain(),
            this._wetNode.gain.value = n,
            this._dryNode = this.CreateGain(),
            this._dryNode.gain.value = 1 - n,
            this._ringNode = this.CreateGain(),
            this._ringNode.gain.value = 0,
            this._oscNode = this._audioContext.createOscillator(),
            this._oscNode.frequency.value = t,
            this._oscNode.connect(this._ringNode.gain),
            this._oscNode.start(0),
            this._inputNode.connect(this._ringNode),
            this._inputNode.connect(this._dryNode),
            this._ringNode.connect(this._wetNode)
        }
        Release() {
            this._oscNode.stop(0),
            this._oscNode.disconnect(),
            this._ringNode.disconnect(),
            this._inputNode.disconnect(),
            this._wetNode.disconnect(),
            this._dryNode.disconnect(),
            super.Release()
        }
        ConnectTo(e) {
            this._wetNode.disconnect(),
            this._wetNode.connect(e),
            this._dryNode.disconnect(),
            this._dryNode.connect(e)
        }
        GetInputNode() {
            return this._inputNode
        }
        SetParam(e, t, n, a) {
            0 === e ? (t = Math.max(Math.min(t / 100, 1), 0),
            this._params[1] = t,
            this.SetAudioParam(this._wetNode.gain, t, n, a),
            this.SetAudioParam(this._dryNode.gain, 1 - t, n, a)) : 7 === e ? (this._params[0] = t,
            this.SetAudioParam(this._oscNode.frequency, t, n, a)) : void 0
        }
    }
    ,
    self.C3AudioDistortionFX = class extends e {
        constructor(t, n, a, o, i, e) {
            super(t),
            this._type = "distortion",
            this._params = [n, a, o, i, e],
            this._inputNode = this.CreateGain(),
            this._preGain = this.CreateGain(),
            this._postGain = this.CreateGain(),
            this._SetDrive(o, i),
            this._wetNode = this.CreateGain(),
            this._wetNode.gain.value = e,
            this._dryNode = this.CreateGain(),
            this._dryNode.gain.value = 1 - e,
            this._waveShaper = this._audioContext.createWaveShaper(),
            this._curve = new Float32Array(65536),
            this._GenerateColortouchCurve(n, a),
            this._waveShaper.curve = this._curve,
            this._inputNode.connect(this._preGain),
            this._inputNode.connect(this._dryNode),
            this._preGain.connect(this._waveShaper),
            this._waveShaper.connect(this._postGain),
            this._postGain.connect(this._wetNode)
        }
        Release() {
            this._inputNode.disconnect(),
            this._preGain.disconnect(),
            this._waveShaper.disconnect(),
            this._postGain.disconnect(),
            this._wetNode.disconnect(),
            this._dryNode.disconnect(),
            super.Release()
        }
        _SetDrive(e, t) {
            .01 > e && (e = .01),
            this._preGain.gain.value = e,
            this._postGain.gain.value = Math.pow(1 / e, .6) * t
        }
        _GenerateColortouchCurve(e, t) {
            for (let n, a = 0; 32768 > a; ++a)
                n = a / 32768,
                n = this._Shape(n, e, t),
                this._curve[32768 + a] = n,
                this._curve[32768 - a - 1] = -n
        }
        _Shape(e, t, n) {
            const a = 1.05 * n * t - t
              , o = 0 > e ? -1 : 1
              , i = 0 > e ? -e : e;
            let d = i < t ? i : t + a * r(i - t, 1 / a);
            return d *= o,
            d
        }
        ConnectTo(e) {
            this._wetNode.disconnect(),
            this._wetNode.connect(e),
            this._dryNode.disconnect(),
            this._dryNode.connect(e)
        }
        GetInputNode() {
            return this._inputNode
        }
        SetParam(e, t, n, a) {
            0 === e ? (t = Math.max(Math.min(t / 100, 1), 0),
            this._params[4] = t,
            this.SetAudioParam(this._wetNode.gain, t, n, a),
            this.SetAudioParam(this._dryNode.gain, 1 - t, n, a)) : void 0
        }
    }
    ,
    self.C3AudioCompressorFX = class extends e {
        constructor(t, n, a, o, i, e) {
            super(t),
            this._type = "compressor",
            this._params = [n, a, o, i, e],
            this._node = this._audioContext.createDynamicsCompressor(),
            this._node.threshold.value = n,
            this._node.knee.value = a,
            this._node.ratio.value = o,
            this._node.attack.value = i,
            this._node.release.value = e
        }
        Release() {
            this._node.disconnect(),
            super.Release()
        }
        ConnectTo(e) {
            this._node.disconnect(),
            this._node.connect(e)
        }
        GetInputNode() {
            return this._node
        }
        SetParam() {}
    }
    ,
    self.C3AudioAnalyserFX = class extends e {
        constructor(e, t, n) {
            super(e),
            this._type = "analyser",
            this._params = [t, n],
            this._node = this._audioContext.createAnalyser(),
            this._node.fftSize = t,
            this._node.smoothingTimeConstant = n,
            this._freqBins = new Float32Array(this._node.frequencyBinCount),
            this._signal = new Uint8Array(t),
            this._peak = 0,
            this._rms = 0,
            this._audioDomHandler._AddAnalyser(this)
        }
        Release() {
            this._audioDomHandler._RemoveAnalyser(this),
            this._node.disconnect(),
            super.Release()
        }
        Tick() {
            this._node.getFloatFrequencyData(this._freqBins),
            this._node.getByteTimeDomainData(this._signal);
            const e = this._node.fftSize;
            this._peak = 0;
            let t = 0;
            for (let n, a = 0; a < e; ++a)
                n = (this._signal[a] - 128) / 128,
                0 > n && (n = -n),
                this._peak < n && (this._peak = n),
                t += n * n;
            this._peak = i(this._peak),
            this._rms = i(Math.sqrt(t / e))
        }
        ConnectTo(e) {
            this._node.disconnect(),
            this._node.connect(e)
        }
        GetInputNode() {
            return this._node
        }
        SetParam() {}
        GetData() {
            return {
                tag: this.GetTag(),
                index: this.GetIndex(),
                peak: this._peak,
                rms: this._rms,
                binCount: this._node.frequencyBinCount,
                freqBins: this._freqBins
            }
        }
    }
}
{
    const e = class extends DOMHandler {
        constructor(e) {
            super(e, "mouse"),
            this.AddRuntimeMessageHandler("cursor", e=>this._OnChangeCursorStyle(e))
        }
        _OnChangeCursorStyle(e) {
            document.documentElement.style.cursor = e
        }
    }
    ;
    RuntimeInterface.AddDOMHandlerClass(e)
}
{
    const e = class extends DOMHandler {
        constructor(e) {
            super(e, "touch"),
            this.AddRuntimeMessageHandler("request-permission", e=>this._OnRequestPermission(e))
        }
        async _OnRequestPermission(e) {
            const t = e.type;
            let n = !0;
            0 === t ? n = await this._RequestOrientationPermission() : 1 === t && (n = await this._RequestMotionPermission()),
            this.PostToRuntime("permission-result", {
                type: t,
                result: n
            })
        }
        async _RequestOrientationPermission() {
            if (!self.DeviceOrientationEvent || !self.DeviceOrientationEvent.requestPermission)
                return !0;
            try {
                const e = await self.DeviceOrientationEvent.requestPermission();
                return "granted" === e
            } catch (e) {
                return console.warn("[Touch] Failed to request orientation permission: ", e),
                !1
            }
        }
        async _RequestMotionPermission() {
            if (!self.DeviceMotionEvent || !self.DeviceMotionEvent.requestPermission)
                return !0;
            try {
                const e = await self.DeviceMotionEvent.requestPermission();
                return "granted" === e
            } catch (e) {
                return console.warn("[Touch] Failed to request motion permission: ", e),
                !1
            }
        }
    }
    ;
    RuntimeInterface.AddDOMHandlerClass(e)
}
{
    const e = class extends DOMHandler {
        constructor(e) {
            super(e, "browser"),
            this._exportType = "",
            this.AddRuntimeMessageHandler("get-initial-state", e=>this._OnGetInitialState(e)),
            this.AddRuntimeMessageHandler("ready-for-sw-messages", ()=>this._OnReadyForSWMessages()),
            this.AddRuntimeMessageHandler("alert", e=>this._OnAlert(e)),
            this.AddRuntimeMessageHandler("close", ()=>this._OnClose()),
            this.AddRuntimeMessageHandler("set-focus", e=>this._OnSetFocus(e)),
            this.AddRuntimeMessageHandler("vibrate", e=>this._OnVibrate(e)),
            this.AddRuntimeMessageHandler("lock-orientation", e=>this._OnLockOrientation(e)),
            this.AddRuntimeMessageHandler("unlock-orientation", ()=>this._OnUnlockOrientation()),
            this.AddRuntimeMessageHandler("navigate", e=>this._OnNavigate(e)),
            this.AddRuntimeMessageHandler("request-fullscreen", e=>this._OnRequestFullscreen(e)),
            this.AddRuntimeMessageHandler("exit-fullscreen", ()=>this._OnExitFullscreen()),
            window.addEventListener("online", ()=>this._OnOnlineStateChanged(!0)),
            window.addEventListener("offline", ()=>this._OnOnlineStateChanged(!1)),
            document.addEventListener("backbutton", ()=>this._OnCordovaBackButton()),
            "undefined" != typeof Windows && Windows.UI.Core.SystemNavigationManager.getForCurrentView().addEventListener("backrequested", e=>this._OnWin10BackRequested(e))
        }
        _OnGetInitialState(e) {
            return this._exportType = e.exportType,
            {
                location: location.toString(),
                isOnline: !!navigator.onLine,
                referrer: document.referrer,
                title: document.title,
                isCookieEnabled: !!navigator.cookieEnabled,
                screenWidth: screen.width,
                screenHeight: screen.height,
                windowOuterWidth: window.outerWidth,
                windowOuterHeight: window.outerHeight,
                isScirraArcade: "undefined" != typeof window.is_scirra_arcade
            }
        }
        _OnReadyForSWMessages() {
            window.C3_RegisterSW && window.OfflineClientInfo && window.OfflineClientInfo.SetMessageCallback(e=>this.PostToRuntime("sw-message", e.data))
        }
        _OnOnlineStateChanged(e) {
            this.PostToRuntime("online-state", {
                isOnline: e
            })
        }
        _OnCordovaBackButton() {
            this.PostToRuntime("backbutton")
        }
        _OnWin10BackRequested(e) {
            e.handled = !0,
            this.PostToRuntime("backbutton")
        }
        GetNWjsWindow() {
            return "nwjs" === this._exportType ? nw.Window.get() : null
        }
        _OnAlert(e) {
            alert(e.message)
        }
        _OnClose() {
            navigator.app && navigator.app.exitApp ? navigator.app.exitApp() : navigator.device && navigator.device.exitApp ? navigator.device.exitApp() : window.close()
        }
        _OnSetFocus(e) {
            const t = e.isFocus;
            if ("nwjs" === this._exportType) {
                const e = this.GetNWjsWindow();
                t ? e.focus() : e.blur()
            } else
                t ? window.focus() : window.blur()
        }
        _OnVibrate(e) {
            navigator.vibrate && navigator.vibrate(e.pattern)
        }
        _OnLockOrientation(e) {
            const t = e.orientation;
            if (screen.orientation && screen.orientation.lock)
                screen.orientation.lock(t).catch(e=>console.warn("[Construct 3] Failed to lock orientation: ", e));
            else
                try {
                    let e = !1;
                    screen.lockOrientation ? e = screen.lockOrientation(t) : screen.webkitLockOrientation ? e = screen.webkitLockOrientation(t) : screen.mozLockOrientation ? e = screen.mozLockOrientation(t) : screen.msLockOrientation && (e = screen.msLockOrientation(t)),
                    e || console.warn("[Construct 3] Failed to lock orientation")
                } catch (e) {
                    console.warn("[Construct 3] Failed to lock orientation: ", e)
                }
        }
        _OnUnlockOrientation() {
            try {
                screen.orientation && screen.orientation.unlock ? screen.orientation.unlock() : screen.unlockOrientation ? screen.unlockOrientation() : screen.webkitUnlockOrientation ? screen.webkitUnlockOrientation() : screen.mozUnlockOrientation ? screen.mozUnlockOrientation() : screen.msUnlockOrientation && screen.msUnlockOrientation()
            } catch (e) {}
        }
        _OnNavigate(e) {
            const t = e.type;
            if ("back" === t)
                navigator.app && navigator.app.backHistory ? navigator.app.backHistory() : window.back();
            else if ("forward" === t)
                window.forward();
            else if ("home" === t)
                window.home();
            else if ("reload" === t)
                location.reload();
            else if ("url" === t) {
                const t = e.url
                  , n = e.target
                  , a = e.exportType;
                "windows-uwp" === a && "undefined" != typeof Windows ? Windows.System.Launcher.launchUriAsync(new Windows.Foundation.Uri(t)) : "cordova" === a ? window.open(t, "_system") : "preview" === a ? window.open(t, "_blank") : !this._isScirraArcade && (2 === n ? window.top.location = t : 1 === n ? window.parent.location = t : window.location = t)
            } else if ("new-window" === t) {
                const t = e.url
                  , n = e.tag
                  , a = e.exportType;
                "windows-uwp" === a && "undefined" != typeof Windows ? Windows.System.Launcher.launchUriAsync(new Windows.Foundation.Uri(t)) : "cordova" === a ? window.open(t, "_system") : window.open(t, n)
            }
        }
        _OnRequestFullscreen(e) {
            const t = {
                navigationUI: "auto"
            }
              , n = e.navUI;
            1 === n ? t.navigationUI = "hide" : 2 === n && (t.navigationUI = "show");
            const a = document.documentElement;
            a.requestFullscreen ? a.requestFullscreen(t) : a.mozRequestFullScreen ? a.mozRequestFullScreen(t) : a.msRequestFullscreen ? a.msRequestFullscreen(t) : a.webkitRequestFullScreen && ("undefined" == typeof Element.ALLOW_KEYBOARD_INPUT ? a.webkitRequestFullScreen() : a.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT))
        }
        _OnExitFullscreen() {
            document.exitFullscreen ? document.exitFullscreen() : document.mozCancelFullScreen ? document.mozCancelFullScreen() : document.msExitFullscreen ? document.msExitFullscreen() : document.webkitCancelFullScreen && document.webkitCancelFullScreen()
        }
    }
    ;
    RuntimeInterface.AddDOMHandlerClass(e)
}
