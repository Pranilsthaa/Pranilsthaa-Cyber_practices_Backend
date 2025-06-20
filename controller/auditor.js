const verifyAuditor = async (req, res) => {
  try {
    if (req?.user?.role == 4) {
      return res.status(200).send({message: 'Auditor verified'});
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

const getDashboardData = async (req, res) => {
  return res.status(200).send({message: 'Dummy dashboard data'});
};

const getReports = async (req, res) => {
  return res.status(200).send({message: 'Dummy reports'});
};

const getActivityLogs = async (req, res) => {
  return res.status(200).send({message: 'Dummy activity logs data'});
};

module.exports = {verifyAuditor, getDashboardData, getReports, getActivityLogs};
