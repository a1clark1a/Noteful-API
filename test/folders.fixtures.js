function makeFoldersArray() {
  return [
    {
      id: 1,
      name: "First Test folder"
    },
    {
      id: 2,
      name: "Second Test folder"
    },
    {
      id: 3,
      name: "Third Test folder"
    },
    {
      id: 4,
      name: "Fourth Test folder"
    }
  ];
}

function makeMaliciousFolder() {
  const maliciousFolder = {
    id: 666,
    name: 'Naughty naughty very naughty <script>alert("xss");</script>'
  };
  const expectedFolder = {
    ...maliciousFolder,
    name:
      'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;'
  };

  return {
    maliciousFolder,
    expectedFolder
  };
}

module.exports = {
  makeFoldersArray,
  makeMaliciousFolder
};
