const moment = require('moment')

module.exports = {
  getParticipants(req, res) {
    const year = Math.max(2018, Number(req.param('year')) || new Date().getFullYear()) // 검색 가능한 년도는 2018~
    const startDateInMillis = +moment(`${year}-01-01`).startOf('year')
    const endDateInMillis = +moment(`${year}-01-01`).endOf('year')

    const {exec} = require('child_process');
    const script = `curl 'http://192.168.200.120:5601/elasticsearch/_msearch' -H 'Origin: http://192.168.200.120:5601' -H 'Accept-Encoding: gzip, deflate' -H 'Accept-Language: ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7,und;q=0.6' -H 'kbn-version: 6.4.1' -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.146 Safari/537.36' -H 'content-type: application/x-ndjson' -H 'Accept: application/json, text/plain, */*' -H 'Referer: http://192.168.200.120:5601/app/kibana' -H 'Connection: keep-alive' --data-binary '{"index":"thequizlive*","ignore_unavailable":true,"timeout":30000,"preference":1538201379821}\n{"aggs":{"2":{"date_histogram":{"field":"timestamp","interval":"1d","time_zone":"Asia/Seoul","min_doc_count":1},"aggs":{"1":{"max":{"field":"participants_count.count"}}}}},"size":0,"_source":{"excludes":[]},"stored_fields":["*"],"script_fields":{},"docvalue_fields":[{"field":"timestamp","format":"date_time"}],"query":{"bool":{"must":[{"match_all":{}},{"range":{"timestamp":{"gte":${startDateInMillis},"lte":${endDateInMillis},"format":"epoch_millis"}}}],"filter":[],"should":[],"must_not":[]}}}\n' --compressed`

    exec(script, (err, stdout, stderr) => {
      if (err) {
        return res.serverError(err)
      }
    
      const buckets = JSON.parse(stdout).responses[0].aggregations[2].buckets
      const result = buckets.map(bucket => {
        const row = {}
        row.count = bucket[1].value
        row.date = moment(bucket.key).format('YYYY-MM-DD')
        return row
      })

      res.json(result)
    });
  }
}