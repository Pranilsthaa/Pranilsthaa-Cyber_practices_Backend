const verifyClient = async (req, res) => {
  try {
    if (req?.user?.role == 2) {
      return res.status(200).send({message: 'Client verified'});
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

module.exports = {verifyClient};
