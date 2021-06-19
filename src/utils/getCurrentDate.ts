interface ICurrentDate {
  year: string;
  month: string;
  date: string;
  hours: string;
  minutes: string;
  seconds: string;
}

export default (): ICurrentDate => {
  const now = new Date();

  return {
    year: now.getFullYear().toString(),
    month: (now.getMonth() + 1).toString().padStart(2, "0"),
    date: now.getDate().toString().padStart(2, "0"),
    hours: now.getHours().toString().padStart(2, "0"),
    minutes: now.getMinutes().toString().padStart(2, "0"),
    seconds: now.getSeconds().toString().padStart(2, "0"),
  };
};
