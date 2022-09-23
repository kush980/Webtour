class APIFeatures {
  constructor(query, queryString) {
    //query is from mongoose and queryString is express from the route in req.query
    this.query = query;
    this.queryString = queryString;
  }
  // eslint-disable-next-line lines-between-class-members
  filter() {
    //this is basic JS, not node.js or expres
    const queryObj = { ...this.queryString };

    const excludedFields = ['page', 'sort', 'fields', 'limit'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B) Advanced Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); //reg exp looks fo gte or gt or lt or lte
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
    //have to return something because need to filter and sort on this object
    //without the return, filtering nothing
  }
  // eslint-disable-next-line lines-between-class-members
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      // expects string query = query.select('name duration price')
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); //everything except the v field
    }
    return this;
  }
  // eslint-disable-next-line lines-between-class-members
  paginate() {
    const page = this.queryString.page * 1 || 1;
    //trick to convert str to number and then the || 1 sets the default to 1
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    // if (this.queryString.page) {
    //   const numTours = await Tour.countDocuments();
    //   if (skip >= numTours) throw new Error('This page does not exist');
    // }
    return this;
  }
}

module.exports = APIFeatures;
