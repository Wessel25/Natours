class APIFeatures {
  constructor(query, queryString) {
    this.query = query; //MongoDb query object, i.e., Tour.find() being passed in within my execution of the class.
    this.queryString = queryString; //This is the req.query object passed in from Epress i.e., "e.g., ?sort=price&fields=name"
  }

  filter() {
    // 1) Filtering
    const queryObj = { ...this.queryString };
    const excludeFields = ['page', 'limit', 'sort', 'fields'];
    excludeFields.forEach((field) => delete queryObj[field]);

    // 2) Advanced Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));
    // let query = Tour.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    // 3) Sorting
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' '); //When multiple sort options in req
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    // 4) Field limiting
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(', ').join(' ');
      this.query = this.query.select('name duration difficulty price');
    } else {
      this.query = this.query.select('-__v'); //The (-) before the __v means to exclude this field
    }

    return this;
  }

  pagination() {
    // 5) Pagination
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    // if (this.queryString.page) {
    //   const numTours = await Tour.countDocuments(); //This method is included ontop of the model
    //   if (skip >= numTours) throw new Error('This page does nog eist');
    // }

    return this;
  }
}

module.exports = APIFeatures;
