const verifyManager = async (req, res) => {
  try {
    if (req?.user?.role == 1) {
      return res.status(200).send({message: 'Manager verified'});
    } else {
      return res
        .status(401)
        .send({message: 'You dont have required permission to access this page'});
    }
  } catch (e) {
    res.status(500).send({message: 'Internal Server Error'});
    console.log(e);
  }
};

module.exports = {verifyManager};
