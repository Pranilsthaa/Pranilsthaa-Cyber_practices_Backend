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

const getReports = async (req, res) => {
  return res.status(200).send({message: 'Dummy reports'});
};

const getDashboardData = async (req, res) => {
  return res.status(200).send({message: 'Dummy dashboard data'});
};

const getClientTickets = async (req, res) => {
  return res.status(200).send({message: 'Dummy client tickets data'});
};

module.exports = {verifyClient, getReports, getDashboardData, getClientTickets};
