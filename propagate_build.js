// propagate website telemetry
// version 1 build 23 date 04252021

function Propagate(parms) {
    parms = parms || {};
    Propagate.prototype.public = {
        medium: "71633dc0f0f9fbf805d5c99727417ddb5cad6a2b7fe53803",
        version: "1.23:04252021",
        customer: parms.customer || -1,
        signatute: parms.signatute || -1,
        render: Date.now()
    }
}
Propagate.prototype.read = (key) => window.sessionStorage.getItem(("propagate::_"+key));
Propagate.prototype.write = (key, value) => window.sessionStorage.setItem("propagate::_"+key, value);
Propagate.prototype.hashGen = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
Propagate.prototype.session = {
    create: () => {
        var ses = {
            now: Date.now(),
            hash: Propagate.prototype.hashGen(24),
            at: window.location.pathname
        }
        Propagate.prototype.write("session", JSON.stringify(ses));
    },
    fetch: () => {
        return JSON.parse(Propagate.prototype.read("session"))
    },
    hash: () => {
        return (JSON.parse(Propagate.prototype.read("session"))).hash;
    }
}
Propagate.prototype.validSessionExists = () => {
    if(Propagate.prototype.session.fetch()) {
        var f = Propagate.prototype.session.fetch();
        if((Date.now() - f.now) <= 3.6e+6) {
            return true;
        }
        return false;
    }
    return false;
}
Propagate.prototype.hasOldSession = () => {
    if(Propagate.prototype.session.fetch()) {
        var f = Propagate.prototype.session.fetch();
        if((Date.now() - f.now) > 3.6e+6) {
            return true;
        }
        return false;
    }
    return false;
}
Propagate.prototype.formTelemetryBody = (opts) => {
    return {
        now: Date.now(),
        cc: "telemetry",
        meta: Propagate.prototype.public,
        body: opts
    }
}
Propagate.prototype.formHeartbeatBody = () => {
    return {
        now: Date.now(),
        cc: "heartbeat",
        meta: Propagate.prototype.public,
        session: Propagate.prototype.session.fetch()
    }
}
Propagate.prototype.flow = {
    create: () => {
        Propagate.prototype.write("flow", JSON.stringify([]))
    },
    update: () => {
        var thisFlow = JSON.parse(Propagate.prototype.read("flow"));
        thisFlow.push({
            path: window.location.pathname,
            now: Date.now(),
            session: Propagate.prototype.session.hash()
        });
        Propagate.prototype.write("flow", JSON.stringify(thisFlow));
    },
    flush: () => {
        var thisFlow = []
        thisFlow.push({
            path: window.location.pathname,
            now: Date.now(),
            session: Propagate.prototype.session.hash()
        });
        Propagate.prototype.write("flow", JSON.stringify(thisFlow));
    }
}
Propagate.prototype.ExportStack = new Array();
Propagate.prototype.absorbVitals = (vitals) => {
    Propagate.prototype.ExportStack.push(vitals)
}
Propagate.prototype.gather = (type) => {
    Propagate.prototype.ExportStack.push({
        flow: JSON.parse(Propagate.prototype.read("flow")),
        session: Propagate.prototype.session.fetch(),
        type
    });
}
Propagate.prototype.fire = async (body, again) => {
    const rawResponse = await fetch("https://propagate.ryanwans.com/", {
        method: 'POST',
        headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Propagate-Version': Propagate.prototype.public.version,
        'Propagate-XCheck': Propagate.prototype.public.medium
        },
        body: JSON.stringify(body)
    }).catch (function(e) {
        if(again) {
            console.warn("[Propagate] Telemetry request failed... retrying.");
            Propagate.prototype.fire(body, false);
        } else {
            console.warn("[Propagate] Telemetry request retry also failed. Stack: ", e);
        }
    });
    const content = await rawResponse.json();

    console.log(content);
}
Propagate.prototype.delayedFire = (delay, type, tel) => {
    setTimeout(() => {
        Propagate.prototype.gather(type);
        var body;
        if(tel) {
            body = Propagate.prototype.formTelemetryBody(Propagate.prototype.ExportStack);
            Propagate.prototype.ExportStack = new Array();
        } else {
            body = Propagate.prototype.formHeartbeatBody();
        }
        Propagate.prototype.fire(body, true);
    }, delay)
}
Propagate.prototype.begin = () => {
    var _newUser, _beginTime = Date.now();
    if(Propagate.prototype.validSessionExists()) {
        _newUser = "active_session";
        try {
            Propagate.prototype.flow.update();
        } catch(e) {
            Propagate.prototype.flow.flush();
        }
    } else {
        if(Propagate.prototype.hasOldSession()) {
            _newUser = "flushed_user";
            Propagate.prototype.session.create();
            Propagate.prototype.flow.flush();
        } else {
            _newUser = "new_user";
            Propagate.prototype.session.create();
            Propagate.prototype.flow.flush();
        }
    }
    Propagate.prototype.delayedFire(1000, _newUser, true);
    Propagate.prototype.delayedFire(60000, _newUser, false);
}