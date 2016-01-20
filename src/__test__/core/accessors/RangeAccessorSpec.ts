import {
  RangeAccessor,
  ImmutableQuery,
  ObjectState,
  RangeQuery,
  BoolShould,
  FilterBucket,
  BoolMust,
  HistogramBucket
} from "../../../"

describe("RangeAccessor", ()=> {

  beforeEach(()=> {
    this.accessor = new RangeAccessor("metascore", {
      title:"Metascore",
      id:"metascore",
      min:0,
      max:100,
      field:"metaScore"
    })
  })

  it("getBuckets()", ()=> {
    expect(this.accessor.getBuckets()).toEqual([])
    this.accessor.results = {
      aggregations:{
        metascore:{
          metascore:{buckets:[1,2]}
        }
      }
    }
    expect(this.accessor.getBuckets())
      .toEqual([1,2])
  })

  describe("build query", () => {

    it("buildSharedQuery()", ()=> {
      let query = new ImmutableQuery()
      this.accessor.state = new ObjectState({min:20, max:70})
      query = this.accessor.buildSharedQuery(query)
      expect(query.query.filter).toEqual(RangeQuery("metaScore", 20, 70))
    })

    it("buildSharedQuery() - empty", ()=> {
      this.accessor.state = new ObjectState()
      let query = new ImmutableQuery()
      let newQuery = this.accessor.buildSharedQuery(query)
      expect(newQuery).toBe(query)
    })

  })

  describe("buildOwnQuery", ()=> {

    beforeEach(()=> {

      this.accessor.state = new ObjectState({min:20, max:70})
      this.query = new ImmutableQuery()
        .addFilter("rating_uuid", BoolShould(["PG"]))
      this.query = this.accessor.buildSharedQuery(this.query)
    })

    it("build own query", ()=> {
      let query = this.accessor.buildOwnQuery(this.query)
      expect(query.query.aggs).toEqual(
        FilterBucket("metascore",
          BoolMust([
            BoolMust([
              BoolShould(["PG"])
            ]),
            {range:{
              metaScore:{
                gte:0, lte:100
              }
            }}
          ]),
          HistogramBucket("metascore", "metaScore", {
            interval:5,
            min_doc_count:0,
            extended_bounds:{
              min:0,
              max:100
            }
          })
        )
      )
    })

  })

})
