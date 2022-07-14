var express = require('express');

function HistoryServer(spacecraft,db) {
    var router = express.Router();

    const getData = (start,end,id) => {
        query = "SELECT timestamp,value,id FROM history WHERE timestamp BETWEEN '" + new Date(start).toISOString().slice(0, 19).replace('T', ' ') + "' AND '" + new Date(end).toISOString().slice(0, 19).replace('T', ' ') + "' AND id='" + id + "'";
        //console.log("query is ", query);

        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.all(query, function(err,rows){
                    if (err) reject(err);
                    resolve(rows);
                }); 
            });
        });
        
    }
    

    router.get('/:pointId', function (req, res) {
        var start = +req.query.start;
        var end = +req.query.end;
        var ids = req.params.pointId.split(',');

        resp = [];

        for (var i = 0; i < ids.length; i++) {
            let promise = getData(start,end,ids[i])
                .then((results) => {
                    //console.log(results);
                    //resp.concat(results);
                    res.status(200).json(results).end();
                });
        }

        //console.log(resp);

        

        // var response = ids.reduce(function (resp, id) {
        //     return resp.concat(spacecraft.history[id].filter(function (p) {
        //         return p.timestamp > start && p.timestamp < end;
        //     }));
        // }, []);


        
    });

    return router;
}

module.exports = HistoryServer;

